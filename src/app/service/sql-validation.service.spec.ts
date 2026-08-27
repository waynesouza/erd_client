import { TestBed } from '@angular/core/testing';
import { SqlValidationService, ValidationResult } from './sql-validation.service';
import { DataType } from '../model/enum/datatype.enum';
import { EntityModel } from '../model/entity.model';
import { makeAttribute, makeEntity } from '../../testing/fixtures';

/**
 * The densest branch surface in the project: 8 private validators reached only
 * through validateEntity / validateDiagram. Each test builds an entity that
 * isolates one rule while satisfying the others, otherwise the error arrays
 * cascade and the assertions stop meaning anything.
 */
describe('SqlValidationService', () => {
  let service: SqlValidationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SqlValidationService);
  });

  /** A valid entity: named, one non-nullable PK. Produces no errors. */
  const validEntity = (overrides: Partial<EntityModel> = {}): EntityModel =>
    makeEntity({ items: [makeAttribute({ name: 'customer_id', pk: true })], ...overrides });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should accept a valid entity', () => {
    const result = service.validateEntity(validEntity());

    expect(result.isValid).toBeTrue();
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  // -------------------------------------------------------------- entity name

  describe('entity name', () => {
    it('should reject a missing name', () => {
      const result = service.validateEntity(validEntity({ key: '' }));

      expect(result.errors).toContain('Entity name is required');
      expect(result.isValid).toBeFalse();
    });

    it('should reject a blank name', () => {
      const result = service.validateEntity(validEntity({ key: '   ' }));

      expect(result.errors).toContain('Entity name is required');
    });

    it('should stop after the missing-name error', () => {
      // The validator returns early, so no other name rule can fire.
      const result = service.validateEntity(validEntity({ key: '' }));

      expect(result.errors.filter(e => e.includes('Entity name'))).toEqual(['Entity name is required']);
    });

    it('should reject a name that does not start with a letter', () => {
      const result = service.validateEntity(validEntity({ key: '1Customer' }));

      expect(result.errors).toContain(
        'Entity name must start with a letter and contain only letters, numbers, and underscores'
      );
    });

    it('should reject a name containing invalid characters', () => {
      const result = service.validateEntity(validEntity({ key: 'Customer-Order' }));

      expect(result.errors).toContain(
        'Entity name must start with a letter and contain only letters, numbers, and underscores'
      );
    });

    it('should accept underscores and digits', () => {
      const result = service.validateEntity(validEntity({ key: 'Customer_2' }));

      expect(result.errors).toEqual([]);
    });

    it('should reject a name longer than 64 characters', () => {
      const result = service.validateEntity(validEntity({ key: 'A'.repeat(65) }));

      expect(result.errors).toContain('Entity name must be 64 characters or less');
    });

    it('should accept a name of exactly 64 characters', () => {
      const result = service.validateEntity(validEntity({ key: 'A'.repeat(64) }));

      expect(result.errors).toEqual([]);
    });

    it('should reject a single-character name', () => {
      const result = service.validateEntity(validEntity({ key: 'A' }));

      expect(result.errors).toContain('Entity name must be at least 2 characters long');
    });

    it('should reject a reserved SQL keyword regardless of case', () => {
      const result = service.validateEntity(validEntity({ key: 'select' }));

      expect(result.errors).toContain(
        '"select" is a reserved SQL keyword and cannot be used as entity name'
      );
    });

    it('should reject every reserved keyword in the list', () => {
      const reserved = ['SELECT', 'FROM', 'TABLE', 'USER', 'TRANSACTION', 'ROLLBACK'];

      reserved.forEach(word => {
        const result = service.validateEntity(validEntity({ key: word }));
        expect(result.errors)
          .withContext(word)
          .toContain(`"${word}" is a reserved SQL keyword and cannot be used as entity name`);
      });
    });

    it('should reject a name already used by another entity', () => {
      const other = makeEntity({ id: 'entity-2', key: 'customer' });
      const result = service.validateEntity(validEntity({ key: 'Customer' }), [other]);

      expect(result.errors).toContain('Entity name "Customer" is already used by another entity');
    });

    it('should not compare an entity against itself', () => {
      const entity = validEntity();
      const result = service.validateEntity(entity, [entity]);

      expect(result.errors).toEqual([]);
    });

    it('should ignore other entities that have no name', () => {
      // Covers the `e.key &&` guard in the duplicate filter.
      const nameless = makeEntity({ id: 'entity-2', key: '' });
      const result = service.validateEntity(validEntity(), [nameless]);

      expect(result.errors).toEqual([]);
    });

    it('should default allEntities to an empty list', () => {
      // Covers the `allEntities: EntityModel[] = []` default-arg branch.
      const result = service.validateEntity(validEntity());

      expect(result.errors).toEqual([]);
    });
  });

  // -------------------------------------------------------------- attributes

  describe('minimum attributes', () => {
    it('should reject an entity with no attributes', () => {
      const result = service.validateEntity(validEntity({ items: [] }));

      expect(result.errors).toContain('Entity must have at least one attribute');
    });

    it('should throw when items is undefined, after flagging the missing attributes', () => {
      // Documents a real defect: validateMinimumAttributes tolerates a missing
      // `items`, but validatePrimaryKey - which runs next - dereferences it
      // unguarded. Recorded, deliberately not fixed.
      const entity = validEntity();
      delete (entity as Partial<EntityModel>).items;

      expect(() => service.validateEntity(entity)).toThrowError(TypeError);
    });
  });

  describe('primary key', () => {
    it('should require a primary key', () => {
      const result = service.validateEntity(validEntity({
        items: [makeAttribute({ name: 'name', pk: false })]
      }));

      expect(result.errors).toContain('Entity must have exactly one Primary Key');
    });

    it('should reject more than one primary key', () => {
      const result = service.validateEntity(validEntity({
        items: [
          makeAttribute({ name: 'a_id', pk: true }),
          makeAttribute({ name: 'b_id', pk: true })
        ]
      }));

      expect(result.errors).toContain(
        'Entity can have only one Primary Key (use composite keys if needed)'
      );
    });

    it('should reject a nullable primary key', () => {
      const result = service.validateEntity(validEntity({
        items: [makeAttribute({ name: 'customer_id', pk: true, nullable: true })]
      }));

      expect(result.errors).toContain('Primary Key "customer_id" cannot be nullable');
    });
  });

  describe('attribute names', () => {
    it('should reject an attribute with no name, reporting its position', () => {
      const result = service.validateEntity(validEntity({
        items: [makeAttribute({ name: 'customer_id', pk: true }), makeAttribute({ name: '' })]
      }));

      expect(result.errors).toContain('Attribute at position 2 must have a name');
    });

    it('should reject an attribute whose name is only whitespace', () => {
      const result = service.validateEntity(validEntity({
        items: [makeAttribute({ name: 'customer_id', pk: true }), makeAttribute({ name: '  ' })]
      }));

      expect(result.errors).toContain('Attribute at position 2 must have a name');
    });

    it('should reject an invalid attribute name', () => {
      const result = service.validateEntity(validEntity({
        items: [makeAttribute({ name: 'customer_id', pk: true }), makeAttribute({ name: '2nd-name' })]
      }));

      expect(result.errors).toContain(
        'Attribute "2nd-name" must start with a letter and contain only letters, numbers, and underscores'
      );
    });

    it('should reject an attribute name longer than 64 characters', () => {
      const longName = 'a'.repeat(65);
      const result = service.validateEntity(validEntity({
        items: [makeAttribute({ name: 'customer_id', pk: true }), makeAttribute({ name: longName })]
      }));

      expect(result.errors).toContain(`Attribute "${longName}" name must be 64 characters or less`);
    });

    it('should reject duplicate attribute names, ignoring case', () => {
      const result = service.validateEntity(validEntity({
        items: [
          makeAttribute({ name: 'customer_id', pk: true }),
          makeAttribute({ name: 'Email' }),
          makeAttribute({ name: 'email' })
        ]
      }));

      expect(result.errors).toContain('Duplicate attribute name: "email"');
    });

    it('should warn about a system column name on a non-key attribute', () => {
      const result = service.validateEntity(validEntity({
        items: [
          makeAttribute({ name: 'customer_id', pk: true }),
          makeAttribute({ name: 'created_at', type: DataType.TIMESTAMP, pk: false })
        ]
      }));

      expect(result.warnings).toContain('"created_at" is commonly used as a system column name');
    });

    it('should not warn when the system column name is the primary key', () => {
      // Covers the `&& !attr.pk` half of the condition.
      const result = service.validateEntity(validEntity({
        items: [makeAttribute({ name: 'id', pk: true })]
      }));

      expect(result.warnings).toEqual([]);
    });
  });

  // -------------------------------------------------------------- data types

  describe('data types', () => {
    it('should require a data type', () => {
      const result = service.validateEntity(validEntity({
        items: [makeAttribute({ name: 'customer_id', pk: true, type: null })]
      }));

      expect(result.errors).toContain('Attribute "customer_id" must have a data type');
    });

    const withAttribute = (overrides: Parameters<typeof makeAttribute>[0]): ValidationResult =>
      service.validateEntity(validEntity({
        items: [makeAttribute({ name: 'customer_id', pk: true, ...overrides })]
      }));

    [DataType.INTEGER, DataType.BIGINT, DataType.DECIMAL, DataType.NUMERIC].forEach(type => {
      it(`should reject a non-numeric default on ${type}`, () => {
        const result = withAttribute({ type, defaultValue: 'abc' });

        expect(result.errors).toContain(
          `customer_id with ${type} type has invalid default value: "abc"`
        );
      });

      it(`should accept a numeric default on ${type}`, () => {
        const result = withAttribute({ type, defaultValue: '42' });

        expect(result.errors).toEqual([]);
      });

      it(`should ignore a whitespace-only default on ${type}`, () => {
        const result = withAttribute({ type, defaultValue: '   ' });

        expect(result.errors).toEqual([]);
      });

      it(`should ignore an empty default on ${type}`, () => {
        const result = withAttribute({ type, defaultValue: '' });

        expect(result.errors).toEqual([]);
      });
    });

    it('should accept the valid BOOLEAN defaults', () => {
      ['true', 'false', '1', '0', 'TRUE', 'FALSE'].forEach(value => {
        const result = withAttribute({ type: DataType.BOOLEAN, defaultValue: value });
        expect(result.errors).withContext(value).toEqual([]);
      });
    });

    it('should reject an invalid BOOLEAN default', () => {
      const result = withAttribute({ type: DataType.BOOLEAN, defaultValue: 'maybe' });

      expect(result.errors).toContain(
        'customer_id with BOOLEAN type has invalid default value: "maybe". Use: true, false, 1, or 0'
      );
    });

    it('should ignore an empty BOOLEAN default', () => {
      const result = withAttribute({ type: DataType.BOOLEAN, defaultValue: '' });

      expect(result.errors).toEqual([]);
    });

    it('should ignore a whitespace-only BOOLEAN default', () => {
      const result = withAttribute({ type: DataType.BOOLEAN, defaultValue: '  ' });

      expect(result.errors).toEqual([]);
    });

    [DataType.DATE, DataType.TIMESTAMP, DataType.TIME].forEach(type => {
      it(`should accept the keyword defaults on ${type}`, () => {
        ['CURRENT_TIMESTAMP', 'now()', 'current_date'].forEach(value => {
          const result = withAttribute({ type, defaultValue: value });
          expect(result.warnings).withContext(value).toEqual([]);
        });
      });

      it(`should accept an ISO date default on ${type}`, () => {
        const result = withAttribute({ type, defaultValue: '2026-01-31' });

        expect(result.warnings).toEqual([]);
      });

      it(`should accept an ISO date-time default on ${type}`, () => {
        const result = withAttribute({ type, defaultValue: '2026-01-31 23:59:59' });

        expect(result.warnings).toEqual([]);
      });

      it(`should warn about an unrecognised date default on ${type}`, () => {
        const result = withAttribute({ type, defaultValue: 'yesterday' });

        expect(result.warnings).toContain(
          'customer_id has potentially invalid date default value: "yesterday"'
        );
      });

      it(`should ignore an empty default on ${type}`, () => {
        const result = withAttribute({ type, defaultValue: '' });

        expect(result.warnings).toEqual([]);
      });

      it(`should ignore a whitespace-only default on ${type}`, () => {
        const result = withAttribute({ type, defaultValue: '   ' });

        expect(result.warnings).toEqual([]);
      });
    });

    [DataType.VARCHAR, DataType.CHAR, DataType.TEXT, DataType.UUID].forEach(type => {
      it(`should apply no default-value rule to ${type}`, () => {
        // No `case` matches - the switch falls through with nothing to report.
        const result = withAttribute({ type, defaultValue: 'anything at all' });

        expect(result.errors).toEqual([]);
        expect(result.warnings).toEqual([]);
      });
    });

    it('should name an unnamed attribute in type messages', () => {
      // Covers the `attr.name || 'unnamed attribute'` fallback. The blank name
      // is reported separately by validateAttributeNames.
      const result = service.validateEntity(validEntity({
        items: [
          makeAttribute({ name: 'customer_id', pk: true }),
          makeAttribute({ name: '', type: DataType.INTEGER, defaultValue: 'abc' })
        ]
      }));

      expect(result.errors).toContain(
        'unnamed attribute with INTEGER type has invalid default value: "abc"'
      );
    });
  });

  // -------------------------------------------------------------- type rules

  describe('type-specific rules', () => {
    it('should reject AUTO_INCREMENT on a non-integer type', () => {
      const result = service.validateEntity(validEntity({
        items: [makeAttribute({ name: 'customer_id', pk: true, type: DataType.VARCHAR, autoIncrement: true })]
      }));

      expect(result.errors).toContain('customer_id with AUTO_INCREMENT must be INTEGER or BIGINT');
    });

    it('should accept AUTO_INCREMENT on INTEGER and BIGINT', () => {
      [DataType.INTEGER, DataType.BIGINT].forEach(type => {
        const result = service.validateEntity(validEntity({
          items: [makeAttribute({ name: 'customer_id', pk: true, type, autoIncrement: true })]
        }));
        expect(result.errors).withContext(type).toEqual([]);
      });
    });

    it('should require AUTO_INCREMENT to be a key or unique', () => {
      const result = service.validateEntity(validEntity({
        items: [
          makeAttribute({ name: 'customer_id', pk: true }),
          makeAttribute({ name: 'seq', autoIncrement: true, pk: false, unique: false })
        ]
      }));

      expect(result.errors).toContain('seq with AUTO_INCREMENT should be PRIMARY KEY or UNIQUE');
    });

    it('should accept a unique non-key AUTO_INCREMENT column', () => {
      const result = service.validateEntity(validEntity({
        items: [
          makeAttribute({ name: 'customer_id', pk: true }),
          makeAttribute({ name: 'seq', autoIncrement: true, pk: false, unique: true })
        ]
      }));

      expect(result.errors).toEqual([]);
    });

    it('should reject a nullable AUTO_INCREMENT column', () => {
      const result = service.validateEntity(validEntity({
        items: [
          makeAttribute({ name: 'customer_id', pk: true }),
          makeAttribute({ name: 'seq', autoIncrement: true, unique: true, nullable: true })
        ]
      }));

      expect(result.errors).toContain('seq with AUTO_INCREMENT cannot be nullable');
    });

    it('should warn about a UNIQUE nullable column', () => {
      const result = service.validateEntity(validEntity({
        items: [
          makeAttribute({ name: 'customer_id', pk: true }),
          makeAttribute({ name: 'email', unique: true, nullable: true })
        ]
      }));

      expect(result.warnings).toContain(
        'email is UNIQUE but nullable - consider making it NOT NULL for better performance'
      );
    });

    it('should name an unnamed AUTO_INCREMENT attribute', () => {
      const result = service.validateEntity(validEntity({
        items: [
          makeAttribute({ name: 'customer_id', pk: true }),
          makeAttribute({ name: '', type: DataType.VARCHAR, autoIncrement: true })
        ]
      }));

      expect(result.errors).toContain('unnamed attribute with AUTO_INCREMENT must be INTEGER or BIGINT');
    });

    it('should reject more than one AUTO_INCREMENT column', () => {
      const result = service.validateEntity(validEntity({
        items: [
          makeAttribute({ name: 'a_id', pk: true, autoIncrement: true }),
          makeAttribute({ name: 'b_seq', unique: true, autoIncrement: true })
        ]
      }));

      expect(result.errors).toContain('Entity can have only one AUTO_INCREMENT column');
    });

    it('should warn when there are more than five UNIQUE constraints', () => {
      const items = [makeAttribute({ name: 'customer_id', pk: true })];
      for (let i = 0; i < 6; i++) {
        items.push(makeAttribute({ name: `field_${i}`, unique: true }));
      }

      const result = service.validateEntity(validEntity({ items }));

      expect(result.warnings).toContain(
        'Entity has 6 UNIQUE constraints - consider if all are necessary for performance'
      );
    });

    it('should not warn at exactly five UNIQUE constraints', () => {
      const items = [makeAttribute({ name: 'customer_id', pk: true })];
      for (let i = 0; i < 5; i++) {
        items.push(makeAttribute({ name: `field_${i}`, unique: true }));
      }

      const result = service.validateEntity(validEntity({ items }));

      expect(result.warnings.some(w => w.includes('UNIQUE constraints'))).toBeFalse();
    });
  });

  // -------------------------------------------------------------- diagram

  describe('validateDiagram', () => {
    it('should accept an empty diagram', () => {
      const result = service.validateDiagram([]);

      expect(result.isValid).toBeTrue();
      expect(result.errors).toEqual([]);
    });

    it('should accept a diagram of valid entities', () => {
      // "Order" is deliberately avoided here - it is a reserved SQL keyword.
      const result = service.validateDiagram([
        validEntity(),
        validEntity({ id: 'entity-2', key: 'Invoice' })
      ]);

      expect(result.isValid).toBeTrue();
    });

    it('should report duplicate entity names once for the diagram', () => {
      const result = service.validateDiagram([
        validEntity({ id: 'entity-1', key: 'Customer' }),
        validEntity({ id: 'entity-2', key: 'customer' })
      ]);

      expect(result.errors).toContain('Duplicate entity name: "customer" is used by 2 entities');
    });

    it('should skip nameless entities when grouping names', () => {
      const result = service.validateDiagram([validEntity({ key: '' })]);

      expect(result.errors.some(e => e.startsWith('Duplicate entity name'))).toBeFalse();
    });

    it('should skip whitespace-only names when grouping names', () => {
      const result = service.validateDiagram([validEntity({ key: '   ' })]);

      expect(result.errors.some(e => e.startsWith('Duplicate entity name'))).toBeFalse();
    });

    it('should prefix errors with the entity name', () => {
      const result = service.validateDiagram([
        validEntity({ key: 'Customer', items: [makeAttribute({ name: 'name', pk: false })] })
      ]);

      expect(result.errors).toContain('[Customer] Entity must have exactly one Primary Key');
    });

    it('should prefix errors with a positional label when the entity has no name', () => {
      const result = service.validateDiagram([
        validEntity({ key: '', items: [makeAttribute({ name: 'name', pk: false })] })
      ]);

      expect(result.errors).toContain('[Entity 1] Entity must have exactly one Primary Key');
    });

    it('should prefix warnings with the entity name', () => {
      const result = service.validateDiagram([
        validEntity({
          key: 'Customer',
          items: [
            makeAttribute({ name: 'customer_id', pk: true }),
            makeAttribute({ name: 'email', unique: true, nullable: true })
          ]
        })
      ]);

      expect(result.warnings).toContain(
        '[Customer] email is UNIQUE but nullable - consider making it NOT NULL for better performance'
      );
    });

    it('should prefix warnings with a positional label when the entity has no name', () => {
      const result = service.validateDiagram([
        validEntity({
          key: '',
          items: [
            makeAttribute({ name: 'customer_id', pk: true }),
            makeAttribute({ name: 'email', unique: true, nullable: true })
          ]
        })
      ]);

      expect(result.warnings).toContain(
        '[Entity 1] email is UNIQUE but nullable - consider making it NOT NULL for better performance'
      );
    });

    it('should warn about a foreign key not ending in _id', () => {
      const result = service.validateDiagram([
        validEntity({
          key: 'Invoice',
          items: [
            makeAttribute({ name: 'order_id', pk: true }),
            makeAttribute({ name: 'customer', fk: true })
          ]
        })
      ]);

      expect(result.warnings).toContain(
        'Foreign key "customer" in entity "Invoice" should typically end with "_id"'
      );
    });

    it('should accept a foreign key ending in _id', () => {
      const result = service.validateDiagram([
        validEntity({
          key: 'Invoice',
          items: [
            makeAttribute({ name: 'order_id', pk: true }),
            makeAttribute({ name: 'customer_id', fk: true })
          ]
        })
      ]);

      expect(result.warnings.some(w => w.startsWith('Foreign key'))).toBeFalse();
    });

    it('should ignore non-foreign-key attributes in the relationship check', () => {
      const result = service.validateDiagram([validEntity()]);

      expect(result.warnings.some(w => w.startsWith('Foreign key'))).toBeFalse();
    });
  });

  // -------------------------------------------------------------- formatting

  describe('formatValidationMessages', () => {
    it('should return an empty string when there is nothing to report', () => {
      expect(service.formatValidationMessages({ isValid: true, errors: [], warnings: [] })).toBe('');
    });

    it('should format errors only', () => {
      const message = service.formatValidationMessages({
        isValid: false, errors: ['first', 'second'], warnings: []
      });

      expect(message).toBe('❌ ERRORS:\n1. first\n2. second\n');
    });

    it('should format warnings only, with no leading blank line', () => {
      // Covers the `errors.length > 0 ? '\n' : ''` ternary taking the else arm.
      const message = service.formatValidationMessages({
        isValid: true, errors: [], warnings: ['careful']
      });

      expect(message).toBe('⚠️ WARNINGS:\n1. careful\n');
    });

    it('should separate errors from warnings with a blank line', () => {
      const message = service.formatValidationMessages({
        isValid: false, errors: ['bad'], warnings: ['careful']
      });

      expect(message).toBe('❌ ERRORS:\n1. bad\n\n⚠️ WARNINGS:\n1. careful\n');
    });
  });
});
