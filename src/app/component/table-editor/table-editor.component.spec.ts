import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { TableEditorComponent } from './table-editor.component';
import { DataType } from '../../model/enum/datatype.enum';
import { DialogSpies, installDialogSpies } from '../../../testing/dialogs';
import { makeAttribute, makeEntity } from '../../../testing/fixtures';

/**
 * Declared in AppModule but rendered by no template - <app-table-editor>
 * appears nowhere. It is still application code and still measured.
 */
describe('TableEditorComponent', () => {
  let fixture: ComponentFixture<TableEditorComponent>;
  let component: TableEditorComponent;
  let dialogs: DialogSpies;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [TableEditorComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TableEditorComponent);
    component = fixture.componentInstance;
    dialogs = installDialogSpies();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose every data type', () => {
    expect(component.dataTypes).toEqual(Object.values(DataType));
  });

  describe('ngOnInit', () => {
    it('should build an empty entity when none is supplied', () => {
      component.ngOnInit();

      expect(component.entity).toEqual({
        id: '', key: '', items: [], location: { x: 0, y: 0 }
      } as unknown as typeof component.entity);
    });

    it('should keep the entity it was given', () => {
      const entity = makeEntity();
      component.entity = entity;

      component.ngOnInit();

      expect(component.entity).toBe(entity);
    });
  });

  describe('addColumn', () => {
    it('should append a nullable VARCHAR column', () => {
      component.entity = makeEntity({ items: [] });

      component.addColumn();

      expect(component.entity.items).toEqual([{
        name: '', type: DataType.VARCHAR, pk: false, fk: false,
        unique: false, nullable: true, autoIncrement: false, defaultValue: ''
      }]);
    });

    it('should preserve the existing columns', () => {
      const existing = makeAttribute({ name: 'customer_id' });
      component.entity = makeEntity({ items: [existing] });

      component.addColumn();

      expect(component.entity.items.length).toBe(2);
      expect(component.entity.items[0]).toBe(existing);
    });
  });

  describe('removeColumn', () => {
    it('should drop the column at the given index', () => {
      component.entity = makeEntity({
        items: [
          makeAttribute({ name: 'a' }),
          makeAttribute({ name: 'b' }),
          makeAttribute({ name: 'c' })
        ]
      });

      component.removeColumn(1);

      expect(component.entity.items.map(i => i.name)).toEqual(['a', 'c']);
    });

    it('should leave the list untouched for an unknown index', () => {
      component.entity = makeEntity({ items: [makeAttribute({ name: 'a' })] });

      component.removeColumn(7);

      expect(component.entity.items.map(i => i.name)).toEqual(['a']);
    });
  });

  describe('closeTableEditor', () => {
    it('should emit the close output', () => {
      const closed = jasmine.createSpy('closed');
      component.onClose.subscribe(closed);

      component.closeTableEditor();

      expect(closed).toHaveBeenCalled();
    });
  });

  describe('saveTable', () => {
    it('should emit the entity and close when the table is valid', () => {
      const saved = jasmine.createSpy('saved');
      const closed = jasmine.createSpy('closed');
      component.onSave.subscribe(saved);
      component.onClose.subscribe(closed);
      component.entity = makeEntity({ items: [makeAttribute({ name: 'customer_id', pk: true })] });

      component.saveTable();

      expect(saved).toHaveBeenCalledOnceWith(component.entity);
      expect(closed).toHaveBeenCalled();
      expect(dialogs.alert).not.toHaveBeenCalled();
    });

    it('should refuse a table with no name', () => {
      const saved = jasmine.createSpy('saved');
      component.onSave.subscribe(saved);
      component.entity = makeEntity({ key: '  ' });

      component.saveTable();

      expect(dialogs.alert).toHaveBeenCalledOnceWith('Table name is required');
      expect(saved).not.toHaveBeenCalled();
    });

    it('should refuse a table with no columns', () => {
      component.entity = makeEntity({ items: [] });

      component.saveTable();

      expect(dialogs.alert).toHaveBeenCalledOnceWith('At least one column is required');
    });

    it('should refuse a table with an unnamed column', () => {
      component.entity = makeEntity({
        items: [makeAttribute({ name: 'customer_id', pk: true }), makeAttribute({ name: ' ' })]
      });

      component.saveTable();

      expect(dialogs.alert).toHaveBeenCalledOnceWith('All columns must have a name');
    });

    it('should refuse a table with no primary key', () => {
      component.entity = makeEntity({ items: [makeAttribute({ name: 'label', pk: false })] });

      component.saveTable();

      expect(dialogs.alert).toHaveBeenCalledOnceWith('At least one primary key is required');
    });
  });
});
