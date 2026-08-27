import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { EntityEditFormComponent } from './entity-edit-form.component';
import { DataType } from '../../model/enum/datatype.enum';
import { DialogSpies, installDialogSpies } from '../../../testing/dialogs';
import { makeAttribute, makeEntity } from '../../../testing/fixtures';

describe('EntityEditFormComponent', () => {
  let fixture: ComponentFixture<EntityEditFormComponent>;
  let component: EntityEditFormComponent;
  let dialogs: DialogSpies;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [EntityEditFormComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(EntityEditFormComponent);
    component = fixture.componentInstance;
    dialogs = installDialogSpies();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with an empty entity at the origin', () => {
    expect(component.entity.id).toBe('');
    expect(component.entity.key).toBe('');
    expect(component.entity.items).toEqual([]);
    expect(component.entity.location.x).toBe(0);
    expect(component.entity.location.y).toBe(0);
  });

  it('should expose every data type', () => {
    expect(component.dataTypes).toEqual(Object.values(DataType));
  });

  describe('addAttribute', () => {
    it('should append a nullable VARCHAR attribute', () => {
      component.entity = makeEntity({ items: [] });

      component.addAttribute();

      expect(component.entity.items).toEqual([{
        name: '', type: DataType.VARCHAR, pk: false, fk: false,
        unique: false, defaultValue: '', nullable: true, autoIncrement: false
      }]);
    });
  });

  describe('removeAttribute', () => {
    it('should remove the attribute once confirmed', () => {
      component.entity = makeEntity({
        items: [makeAttribute({ name: 'a' }), makeAttribute({ name: 'b' })]
      });

      component.removeAttribute(0);

      expect(component.entity.items.map(i => i.name)).toEqual(['b']);
    });

    it('should keep the attribute when the user cancels', () => {
      dialogs.confirm.and.returnValue(false);
      component.entity = makeEntity({
        items: [makeAttribute({ name: 'a' }), makeAttribute({ name: 'b' })]
      });

      component.removeAttribute(0);

      expect(component.entity.items.map(i => i.name)).toEqual(['a', 'b']);
    });
  });

  describe('updateEntity', () => {
    it('should emit the entity and close', () => {
      const updated = jasmine.createSpy('updated');
      const closed = jasmine.createSpy('closed');
      component.entityUpdated.subscribe(updated);
      component.close.subscribe(closed);
      component.entity = makeEntity();

      component.updateEntity();

      expect(updated).toHaveBeenCalledOnceWith(component.entity);
      expect(closed).toHaveBeenCalled();
    });
  });

  describe('closeModal', () => {
    it('should emit the close output', () => {
      const closed = jasmine.createSpy('closed');
      component.close.subscribe(closed);

      component.closeModal();

      expect(closed).toHaveBeenCalled();
    });
  });

  describe('onPrimaryKeyChange', () => {
    it('should make the new key the only one, and not nullable', () => {
      const first = makeAttribute({ name: 'a', pk: true });
      const second = makeAttribute({ name: 'b', pk: true, nullable: true });
      component.entity = makeEntity({ items: [first, second] });

      component.onPrimaryKeyChange(second);

      expect(first.pk).toBeFalse();
      expect(second.pk).toBeTrue();
      expect(second.nullable).toBeFalse();
    });

    it('should do nothing when the attribute is not a key', () => {
      const first = makeAttribute({ name: 'a', pk: true });
      const second = makeAttribute({ name: 'b', pk: false, nullable: true });
      component.entity = makeEntity({ items: [first, second] });

      component.onPrimaryKeyChange(second);

      expect(first.pk).toBeTrue();
      expect(second.nullable).toBeTrue();
    });
  });

  describe('onAutoIncrementChange', () => {
    it('should do nothing when auto-increment is switched off', () => {
      const attribute = makeAttribute({ name: 'a', autoIncrement: false, nullable: true, type: DataType.TEXT });
      component.entity = makeEntity({ items: [attribute] });

      component.onAutoIncrementChange(attribute);

      expect(attribute.nullable).toBeTrue();
      expect(attribute.type).toBe(DataType.TEXT);
    });

    it('should clear auto-increment on every other attribute', () => {
      const other = makeAttribute({ name: 'a', autoIncrement: true });
      const attribute = makeAttribute({ name: 'b', autoIncrement: true, unique: true });
      component.entity = makeEntity({ items: [other, attribute] });

      component.onAutoIncrementChange(attribute);

      expect(other.autoIncrement).toBeFalse();
      expect(attribute.autoIncrement).toBeTrue();
    });

    it('should force the attribute to be NOT NULL', () => {
      const attribute = makeAttribute({ name: 'a', autoIncrement: true, unique: true, nullable: true });
      component.entity = makeEntity({ items: [attribute] });

      component.onAutoIncrementChange(attribute);

      expect(attribute.nullable).toBeFalse();
    });

    it('should coerce a non-integer type to INTEGER', () => {
      const attribute = makeAttribute({ name: 'a', autoIncrement: true, unique: true, type: DataType.VARCHAR });
      component.entity = makeEntity({ items: [attribute] });

      component.onAutoIncrementChange(attribute);

      expect(attribute.type).toBe(DataType.INTEGER);
    });

    [DataType.INTEGER, DataType.BIGINT].forEach(type => {
      it(`should keep an existing ${type} type`, () => {
        const attribute = makeAttribute({ name: 'a', autoIncrement: true, unique: true, type });
        component.entity = makeEntity({ items: [attribute] });

        component.onAutoIncrementChange(attribute);

        expect(attribute.type).toBe(type);
      });
    });

    it('should promote a plain attribute to primary key', () => {
      const other = makeAttribute({ name: 'a', pk: true });
      const attribute = makeAttribute({ name: 'b', pk: false, unique: false, autoIncrement: true });
      component.entity = makeEntity({ items: [other, attribute] });

      component.onAutoIncrementChange(attribute);

      expect(attribute.pk).toBeTrue();
      expect(other.pk).toBeFalse();   // onPrimaryKeyChange cascaded
    });

    it('should not promote an attribute that is already a key', () => {
      const other = makeAttribute({ name: 'a', pk: true });
      const attribute = makeAttribute({ name: 'b', pk: true, autoIncrement: true });
      component.entity = makeEntity({ items: [other, attribute] });

      component.onAutoIncrementChange(attribute);

      expect(other.pk).toBeTrue();    // no cascade ran
    });

    it('should not promote a unique attribute', () => {
      const attribute = makeAttribute({ name: 'b', pk: false, unique: true, autoIncrement: true });
      component.entity = makeEntity({ items: [attribute] });

      component.onAutoIncrementChange(attribute);

      expect(attribute.pk).toBeFalse();
    });
  });

  describe('validateAttributeName', () => {
    it('should reject an empty name', () => {
      const attribute = makeAttribute({ name: '' });
      component.entity = makeEntity({ items: [attribute] });

      expect(component.validateAttributeName(attribute)).toBeFalse();
    });

    it('should reject a blank name', () => {
      const attribute = makeAttribute({ name: '   ' });
      component.entity = makeEntity({ items: [attribute] });

      expect(component.validateAttributeName(attribute)).toBeFalse();
    });

    it('should reject an invalid name', () => {
      const attribute = makeAttribute({ name: '1st-name' });
      component.entity = makeEntity({ items: [attribute] });

      expect(component.validateAttributeName(attribute)).toBeFalse();
    });

    it('should reject a duplicate name regardless of case', () => {
      const attribute = makeAttribute({ name: 'Email' });
      component.entity = makeEntity({ items: [makeAttribute({ name: 'email' }), attribute] });

      expect(component.validateAttributeName(attribute)).toBeFalse();
    });

    it('should ignore other attributes that have no name', () => {
      const attribute = makeAttribute({ name: 'email' });
      component.entity = makeEntity({ items: [makeAttribute({ name: '' }), attribute] });

      expect(component.validateAttributeName(attribute)).toBeTrue();
    });

    it('should accept a unique, well-formed name', () => {
      const attribute = makeAttribute({ name: 'customer_id' });
      component.entity = makeEntity({ items: [attribute] });

      expect(component.validateAttributeName(attribute)).toBeTrue();
    });
  });

  describe('validateEntityName', () => {
    it('should reject an empty name', () => {
      component.entity = makeEntity({ key: '' });

      expect(component.validateEntityName()).toBeFalse();
    });

    it('should reject a blank name', () => {
      component.entity = makeEntity({ key: '   ' });

      expect(component.validateEntityName()).toBeFalse();
    });

    it('should reject an invalid name', () => {
      component.entity = makeEntity({ key: '1Customer' });

      expect(component.validateEntityName()).toBeFalse();
    });

    it('should reject a single-character name', () => {
      component.entity = makeEntity({ key: 'A' });

      expect(component.validateEntityName()).toBeFalse();
    });

    it('should reject a name longer than 64 characters', () => {
      component.entity = makeEntity({ key: 'A'.repeat(65) });

      expect(component.validateEntityName()).toBeFalse();
    });

    it('should accept a well-formed name', () => {
      component.entity = makeEntity({ key: 'Customer' });

      expect(component.validateEntityName()).toBeTrue();
    });
  });

  describe('hasPrimaryKey', () => {
    it('should be true when some attribute is a key', () => {
      component.entity = makeEntity({ items: [makeAttribute({ pk: true })] });

      expect(component.hasPrimaryKey()).toBeTrue();
    });

    it('should be false when no attribute is a key', () => {
      component.entity = makeEntity({ items: [makeAttribute({ pk: false })] });

      expect(component.hasPrimaryKey()).toBeFalse();
    });
  });

  describe('getAttributeError', () => {
    it('should report a missing name', () => {
      const attribute = makeAttribute({ name: '' });
      component.entity = makeEntity({ items: [attribute] });

      expect(component.getAttributeError(attribute)).toBe('Name is required');
    });

    it('should report a blank name', () => {
      const attribute = makeAttribute({ name: '  ' });
      component.entity = makeEntity({ items: [attribute] });

      expect(component.getAttributeError(attribute)).toBe('Name is required');
    });

    it('should report an invalid name', () => {
      const attribute = makeAttribute({ name: '1st' });
      component.entity = makeEntity({ items: [attribute] });

      expect(component.getAttributeError(attribute))
        .toBe('Must start with letter, use only letters, numbers, underscores');
    });

    it('should report a duplicate name', () => {
      const attribute = makeAttribute({ name: 'Email' });
      component.entity = makeEntity({ items: [makeAttribute({ name: 'email' }), attribute] });

      expect(component.getAttributeError(attribute)).toBe('Duplicate name');
    });

    it('should report nothing for a valid attribute', () => {
      const attribute = makeAttribute({ name: 'customer_id' });
      component.entity = makeEntity({ items: [attribute] });

      expect(component.getAttributeError(attribute)).toBe('');
    });
  });
});
