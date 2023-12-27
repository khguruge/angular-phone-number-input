import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AngularPhoneNumberInput } from './angular-phone-number-input.component';

describe('AngularPhoneNumberInput', () => {
  let component: AngularPhoneNumberInput;
  let fixture: ComponentFixture<AngularPhoneNumberInput>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AngularPhoneNumberInput]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AngularPhoneNumberInput);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
