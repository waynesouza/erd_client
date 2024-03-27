import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntityEditFormComponent } from './entity-edit-form.component';

describe('EntityEditFormComponent', () => {
  let component: EntityEditFormComponent;
  let fixture: ComponentFixture<EntityEditFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EntityEditFormComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EntityEditFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
