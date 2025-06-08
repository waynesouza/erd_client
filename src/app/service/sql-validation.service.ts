import { Injectable } from '@angular/core';
import { EntityModel } from '../model/entity.model';
import { AttributeModel } from '../model/attribute.model';
import { DataType } from '../model/enum/datatype.enum';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

@Injectable({
  providedIn: 'root'
})
export class SqlValidationService {

  constructor() { }

  /**
   * Valida uma entidade individual
   */
  validateEntity(entity: EntityModel, allEntities: EntityModel[] = []): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // 1. Validação do nome da entidade
    this.validateEntityName(entity, allEntities, result);

    // 2. Validação de atributos mínimos
    this.validateMinimumAttributes(entity, result);

    // 3. Validação de Primary Key
    this.validatePrimaryKey(entity, result);

    // 4. Validação de nomes de atributos
    this.validateAttributeNames(entity, result);

    // 5. Validação de tipos de dados
    this.validateDataTypes(entity, result);

    // 6. Validação de regras específicas por tipo
    this.validateTypeSpecificRules(entity, result);

    // 7. Validação de AUTO_INCREMENT
    this.validateAutoIncrement(entity, result);

    // 8. Validação de UNIQUE constraints
    this.validateUniqueConstraints(entity, result);

    result.isValid = result.errors.length === 0;
    return result;
  }

  /**
   * Valida o diagrama completo
   */
  validateDiagram(entities: EntityModel[]): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // 1. Validação de nomes únicos de entidades
    this.validateUniqueEntityNames(entities, result);

    // 2. Validação individual de cada entidade
    entities.forEach((entity, index) => {
      const entityResult = this.validateEntity(entity, entities);

      // Prefixar erros com nome da entidade
      entityResult.errors.forEach(error => {
        result.errors.push(`[${entity.key || `Entity ${index + 1}`}] ${error}`);
      });

      entityResult.warnings.forEach(warning => {
        result.warnings.push(`[${entity.key || `Entity ${index + 1}`}] ${warning}`);
      });
    });

    // 3. Validação de relacionamentos (se necessário)
    this.validateRelationships(entities, result);

    result.isValid = result.errors.length === 0;
    return result;
  }

  private validateEntityName(entity: EntityModel, allEntities: EntityModel[], result: ValidationResult): void {
    // Nome obrigatório
    if (!entity.key || entity.key.trim() === '') {
      result.errors.push('Entity name is required');
      return;
    }

    const entityName = entity.key.trim();

    // Validação de caracteres SQL válidos
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(entityName)) {
      result.errors.push('Entity name must start with a letter and contain only letters, numbers, and underscores');
    }

    // Tamanho do nome
    if (entityName.length > 64) {
      result.errors.push('Entity name must be 64 characters or less');
    }

    if (entityName.length < 2) {
      result.errors.push('Entity name must be at least 2 characters long');
    }

    // Palavras reservadas SQL
    const reservedWords = [
      'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER',
      'TABLE', 'INDEX', 'VIEW', 'TRIGGER', 'PROCEDURE', 'FUNCTION', 'DATABASE', 'SCHEMA',
      'PRIMARY', 'FOREIGN', 'KEY', 'CONSTRAINT', 'UNIQUE', 'NOT', 'NULL', 'DEFAULT',
      'ORDER', 'BY', 'GROUP', 'HAVING', 'UNION', 'JOIN', 'INNER', 'OUTER', 'LEFT', 'RIGHT',
      'USER', 'ROLE', 'GRANT', 'REVOKE', 'COMMIT', 'ROLLBACK', 'TRANSACTION'
    ];

    if (reservedWords.includes(entityName.toUpperCase())) {
      result.errors.push(`"${entityName}" is a reserved SQL keyword and cannot be used as entity name`);
    }

    // Verificação de nomes duplicados
    const duplicates = allEntities.filter(e =>
      e.id !== entity.id &&
      e.key &&
      e.key.toLowerCase() === entityName.toLowerCase()
    );

    if (duplicates.length > 0) {
      result.errors.push(`Entity name "${entityName}" is already used by another entity`);
    }
  }

  private validateMinimumAttributes(entity: EntityModel, result: ValidationResult): void {
    if (!entity.items || entity.items.length === 0) {
      result.errors.push('Entity must have at least one attribute');
    }
  }

  private validatePrimaryKey(entity: EntityModel, result: ValidationResult): void {
    const primaryKeys = entity.items.filter(attr => attr.pk);

    if (primaryKeys.length === 0) {
      result.errors.push('Entity must have exactly one Primary Key');
    } else if (primaryKeys.length > 1) {
      result.errors.push('Entity can have only one Primary Key (use composite keys if needed)');
    }

    // PK não pode ser nullable
    primaryKeys.forEach(pk => {
      if (pk.nullable) {
        result.errors.push(`Primary Key "${pk.name}" cannot be nullable`);
      }
    });
  }

  private validateAttributeNames(entity: EntityModel, result: ValidationResult): void {
    const attributeNames = new Set<string>();

    entity.items.forEach((attr, index) => {
      // Nome obrigatório
      if (!attr.name || attr.name.trim() === '') {
        result.errors.push(`Attribute at position ${index + 1} must have a name`);
        return;
      }

      const attrName = attr.name.trim();

      // Validação de caracteres SQL válidos
      if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(attrName)) {
        result.errors.push(`Attribute "${attrName}" must start with a letter and contain only letters, numbers, and underscores`);
      }

      // Tamanho do nome
      if (attrName.length > 64) {
        result.errors.push(`Attribute "${attrName}" name must be 64 characters or less`);
      }

      // Nomes duplicados
      const lowerName = attrName.toLowerCase();
      if (attributeNames.has(lowerName)) {
        result.errors.push(`Duplicate attribute name: "${attrName}"`);
      }
      attributeNames.add(lowerName);

      // Palavras reservadas para colunas
      const reservedColumnNames = ['id', 'created_at', 'updated_at', 'deleted_at'];
      if (reservedColumnNames.includes(lowerName) && !attr.pk) {
        result.warnings.push(`"${attrName}" is commonly used as a system column name`);
      }
    });
  }

  private validateDataTypes(entity: EntityModel, result: ValidationResult): void {
    entity.items.forEach(attr => {
      if (!attr.type) {
        result.errors.push(`Attribute "${attr.name}" must have a data type`);
        return;
      }

      // Validações específicas por tipo
      this.validateSpecificDataType(attr, result);
    });
  }

  private validateSpecificDataType(attr: AttributeModel, result: ValidationResult): void {
    const attrName = attr.name || 'unnamed attribute';

    switch (attr.type) {
      case DataType.INTEGER:
      case DataType.BIGINT:
        // Números não deveriam ter default values não-numéricos
        if (attr.defaultValue && attr.defaultValue.trim() !== '' && isNaN(Number(attr.defaultValue))) {
          result.errors.push(`${attrName} with ${attr.type} type has invalid default value: "${attr.defaultValue}"`);
        }
        break;

      case DataType.DECIMAL:
      case DataType.NUMERIC:
        if (attr.defaultValue && attr.defaultValue.trim() !== '' && isNaN(Number(attr.defaultValue))) {
          result.errors.push(`${attrName} with ${attr.type} type has invalid default value: "${attr.defaultValue}"`);
        }
        break;

      case DataType.BOOLEAN:
        if (attr.defaultValue && attr.defaultValue.trim() !== '') {
          const validBooleans = ['true', 'false', '1', '0', 'TRUE', 'FALSE'];
          if (!validBooleans.includes(attr.defaultValue.trim())) {
            result.errors.push(`${attrName} with BOOLEAN type has invalid default value: "${attr.defaultValue}". Use: true, false, 1, or 0`);
          }
        }
        break;

      case DataType.DATE:
      case DataType.TIMESTAMP:
      case DataType.TIME:
        if (attr.defaultValue && attr.defaultValue.trim() !== '') {
          const validDateDefaults = ['CURRENT_TIMESTAMP', 'NOW()', 'CURRENT_DATE'];
          if (!validDateDefaults.includes(attr.defaultValue.toUpperCase()) &&
              !this.isValidDateFormat(attr.defaultValue)) {
            result.warnings.push(`${attrName} has potentially invalid date default value: "${attr.defaultValue}"`);
          }
        }
        break;
    }
  }

  private validateTypeSpecificRules(entity: EntityModel, result: ValidationResult): void {
    entity.items.forEach(attr => {
      const attrName = attr.name || 'unnamed attribute';

      // AUTO_INCREMENT só para tipos numéricos inteiros
      if (attr.autoIncrement) {
        const validAutoIncrementTypes = [DataType.INTEGER, DataType.BIGINT];
        if (!validAutoIncrementTypes.includes(attr.type as DataType)) {
          result.errors.push(`${attrName} with AUTO_INCREMENT must be INTEGER or BIGINT`);
        }

        // AUTO_INCREMENT deve ser PRIMARY KEY ou UNIQUE
        if (!attr.pk && !attr.unique) {
          result.errors.push(`${attrName} with AUTO_INCREMENT should be PRIMARY KEY or UNIQUE`);
        }

        // AUTO_INCREMENT não pode ser nullable
        if (attr.nullable) {
          result.errors.push(`${attrName} with AUTO_INCREMENT cannot be nullable`);
        }
      }

      // UNIQUE + NOT NULL para chaves alternativas
      if (attr.unique && attr.nullable) {
        result.warnings.push(`${attrName} is UNIQUE but nullable - consider making it NOT NULL for better performance`);
      }
    });
  }

  private validateAutoIncrement(entity: EntityModel, result: ValidationResult): void {
    const autoIncrementCols = entity.items.filter(attr => attr.autoIncrement);

    if (autoIncrementCols.length > 1) {
      result.errors.push('Entity can have only one AUTO_INCREMENT column');
    }
  }

  private validateUniqueConstraints(entity: EntityModel, result: ValidationResult): void {
    // Verificar se há muitas constraints UNIQUE (performance)
    const uniqueCols = entity.items.filter(attr => attr.unique);

    if (uniqueCols.length > 5) {
      result.warnings.push(`Entity has ${uniqueCols.length} UNIQUE constraints - consider if all are necessary for performance`);
    }
  }

  private validateUniqueEntityNames(entities: EntityModel[], result: ValidationResult): void {
    const entityNames = new Map<string, EntityModel[]>();

    entities.forEach(entity => {
      if (entity.key && entity.key.trim() !== '') {
        const lowerName = entity.key.toLowerCase();
        if (!entityNames.has(lowerName)) {
          entityNames.set(lowerName, []);
        }
        entityNames.get(lowerName)!.push(entity);
      }
    });

    entityNames.forEach((entitiesWithSameName, name) => {
      if (entitiesWithSameName.length > 1) {
        result.errors.push(`Duplicate entity name: "${name}" is used by ${entitiesWithSameName.length} entities`);
      }
    });
  }

  private validateRelationships(entities: EntityModel[], result: ValidationResult): void {
    // Validar se foreign keys referenciam primary keys existentes
    entities.forEach(entity => {
      entity.items.filter(attr => attr.fk).forEach(fkAttr => {
        // Aqui você pode adicionar lógica para validar relacionamentos
        // se tiver um sistema de relacionamentos mais complexo

        if (!fkAttr.name.endsWith('_id')) {
          result.warnings.push(`Foreign key "${fkAttr.name}" in entity "${entity.key}" should typically end with "_id"`);
        }
      });
    });
  }

  private isValidDateFormat(dateString: string): boolean {
    // Validação simples de formato de data
    const datePatterns = [
      /^\d{4}-\d{2}-\d{2}$/,                    // YYYY-MM-DD
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/  // YYYY-MM-DD HH:MM:SS
    ];

    return datePatterns.some(pattern => pattern.test(dateString));
  }

  /**
   * Utilitário para formatar erros e warnings para exibição
   */
  formatValidationMessages(result: ValidationResult): string {
    let message = '';

    if (result.errors.length > 0) {
      message += '❌ ERRORS:\n';
      result.errors.forEach((error, index) => {
        message += `${index + 1}. ${error}\n`;
      });
    }

    if (result.warnings.length > 0) {
      message += result.errors.length > 0 ? '\n' : '';
      message += '⚠️ WARNINGS:\n';
      result.warnings.forEach((warning, index) => {
        message += `${index + 1}. ${warning}\n`;
      });
    }

    return message;
  }

}
