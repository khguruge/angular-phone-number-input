import { Component, Input, forwardRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Countries } from '../assets/country-dataset';
import { CountryData } from '../data-types/countryList';
import { globeSVG } from '../assets/globe-svg';
import { Country } from '../data-types/country';

@Component({
  selector: 'angular-phone-number-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './angular-phone-number-input.component.html',
  styleUrl: './angular-phone-number-input.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AngularPhoneNumberInput),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => AngularPhoneNumberInput),
      multi: true,
    },
  ],
})
export class AngularPhoneNumberInput implements ControlValueAccessor, Validator {
  @Input() error: boolean | undefined = false;
  @Input() defaultCountry!: string;
  @Input() preferredCountries!: string[];

  sanitizer = inject(DomSanitizer);
  countryList: CountryData = Countries;
  dataSet: CountryData = Countries;
  showModal: boolean = false;
  selectedCountry!: Country;
  inputFocused: boolean = false;
  disabled: boolean = false;
  value!: string;
  globeSVG: string = globeSVG;

  /** Callback function triggered on value change. */
  onChange: (value: string) => void = () => { };

  /** Callback function triggered on input touch. */
  onTouched: () => void = () => { };

  /** Handles the input blur event. */
  onBlur = () => {
    this.inputFocused = false;
  };

  /**
   * Handles the input focus event.
   */
  onFocus = (): void => {
    this.inputFocused = true;
  };

  /**
   * Writes a new value to the input.
   * @param obj - The new value.
   */
  writeValue = (value: string): void => {
    if (value !== undefined) {
      this.extractValues(value)
    }
  };

  /**
   * Registers a callback function to be executed when the input value changes.
   * @param fn - The callback function.
   */
  registerOnChange = (fn: () => void): void => {
    this.onChange = fn;
  };

  /**
   * Registers a callback function to be executed when the input is touched.
   * @param fn - The callback function.
   */
  registerOnTouched = (fn: () => void): void => {
    this.onTouched = fn;
  };

  /**
   * Sets the disabled state of the input.
   * @param isDisabled - The disabled state.
   */
  setDisabledState = (isDisabled: boolean): void => {
    this.disabled = isDisabled;
  };

  /**
   * Initializes default country and preferred countries on component initialization.
   * Calls setDefaultCountry and setPreferredCountries methods.
   */
  ngOnInit() {
    this.setDefaultCountry();
    this.setPreferredCountries();
  }

  /**
   * Sets the default country based on the provided defaultCountry value.
   * If the default country exists in the countryList, sets the selectedCountry accordingly.
   */
  setDefaultCountry = () => {
    const defCountryData = this.countryList[this.defaultCountry];
    this.selectedCountry = defCountryData ?? null;
  }

  /**
   * Sets preferred countries based on the provided preferredCountries array.
   * Filters the countryList to contain only the preferred countries if they exist.
   */
  setPreferredCountries = () => {
    if (this.preferredCountries && this.preferredCountries.length > 0) {
      // Filter the countries to include only preferred countries
      const preferredCountryList = Object.fromEntries(
        Object.entries(Countries).filter(([code]) => this.preferredCountries.includes(code))
      );

      // If preferred countries are found, update the countryList
      if (Object.keys(preferredCountryList).length > 0) {
        this.countryList = preferredCountryList;
      }
    }
  }

  /**
   * Toggles the modal visibility and sets the dataSet to the current countryList.
   */
  toggleModal(): void {
    this.dataSet = this.countryList
    this.showModal = !this.showModal;
  }

  /**
   * Sets the full phone number by concatenating the country dial code and the input value.
   * Updates the value using the onChange callback.
   * @returns {void}
   */
  setFullPhoneNumber = () => {
    const fullPhoneNumber = this.selectedCountry ? this.selectedCountry.dialCode + (this.value || '') : this.value || '';
    // Trigger the onChange callback with the updated full phone number
    this.onChange(fullPhoneNumber);
  }

  /**
   * Selects a country and emits the corresponding event.
   * @param {Country} data - The selected country data.
   */
  selectCountry(data: { key: string; value: CountryData[string] }): void {
    this.selectedCountry = data.value;
    this.setFullPhoneNumber();
    this.toggleModal();
  }

  /**
   * Extracts the country code and phone number from the provided phone number string.
   * @param {string} phoneNumber - The input phone number string.
   * @returns {void}
   */
  extractValues = (phoneNumber: string) => {
    let country!: Country; // Variable to store the extracted country data
    let countryCode = ''; // Variable to store the extracted country code
    const countryCodes = Object.keys(Countries);
    console.log("phoneNumber", phoneNumber);

    // Sort the country codes by length in descending order
    const sortedCodes = countryCodes.sort((a, b) => Countries[b].dialCode.length - Countries[a].dialCode.length);

    // Iterate through sorted country codes to find a match in the input value
    for (const code of sortedCodes) {
      if (phoneNumber.startsWith(Countries[code].dialCode)) {
        country = Countries[code];
        break;
      }
    }
    // If a matching country code is found, extract the country code and phone number
    if (country) {
      countryCode = country.dialCode;
      this.value = phoneNumber.substring(countryCode.length);
    } else {
      // If no matching country code is found, attempt to extract country code based on length (1 to 4 digits)
      for (let i = 1; i <= 4; i++) {
        const potentialCode = phoneNumber.substring(0, i);
        if (countryCodes.some(code => Countries[code].dialCode === `+${potentialCode}`)) {
          countryCode = `+${potentialCode}`;
          this.value = phoneNumber.substring(i);
          break;
        }
      }
      // If no country code is identified, consider the entire input as the phone number
      if (!countryCode) {
        // Remove the "+" sign from the phone number if it exists
        this.value = phoneNumber.replace('+', '');
      }
    }
    if (country) {
      this.selectedCountry = country
    }
  }

  /**
   * Tries to determine the selected country based on the provided input value.
   * Updates the selected country and value if a matching country code is found.
   * @returns {void}
   */
  getCountryWithInput() {
    if (this.value) {
      // temp number to hold the input value
      const tempNum = '+' + this.value.toString();
      if (!this.selectedCountry && this.value && tempNum.length === 5) {
        const countryCodes = Object.keys(Countries);
        const sortedCodes = countryCodes.sort((a, b) => Countries[b].dialCode.length - Countries[a].dialCode.length);
        for (const code of sortedCodes) {
          if (tempNum.startsWith(Countries[code].dialCode)) {
            this.selectedCountry = Countries[code];
            // remove the country code from input value
            this.value = this.value.toString().substring(this.selectedCountry.dialCode.length - 1);
            break;
          }
        }
      }
    }
  }

  /**
   * Emits the current input value.
   */
  onInputChanged(): void {
    this.setFullPhoneNumber();
    this.getCountryWithInput();
  }

  /**
   * Filters the countries based on the provided search term and updates the dataset.
   * @param {string} searchTerm - The term to search for within country names or dial codes.
   * @returns {void}
   */
  filterCountries(searchTerm: string): void {
    // Convert the searchTerm to lowercase for case-insensitive matching
    searchTerm = searchTerm.toLowerCase();
    // Filter the countryList based on the searchTerm and update dataSet
    this.dataSet = Object.keys(this.countryList)
      .filter(code =>
        this.countryList[code].country.toLowerCase().includes(searchTerm) ||
        this.countryList[code].dialCode.includes(searchTerm)
      )
      .reduce((obj: CountryData, code) => {
        // Reduce the filtered keys back into an object
        obj[code] = this.countryList[code];
        return obj;
      }, {});
  }

  /**
   * Handles changes in the search input by invoking the filterCountries method with the input value.
   * @param {Event} event - The event object from the search input.
   * @returns {void}
   */
  onSearchChange(event: Event): void {
    const searchTerm = (event.target as HTMLInputElement).value;
    this.filterCountries(searchTerm);
  }

  /**
   * Retrieves the sanitized HTML representation of an icon string.
   * @param {string | undefined} iconString - The string representation of an SVG icon.
   * @returns {SafeHtml | undefined} The sanitized HTML representation of the icon string.
   */
  getIcon = (iconString: string | undefined): SafeHtml | undefined => {
    if (iconString) {
      return this.sanitizer.bypassSecurityTrustHtml(iconString);
    }
    return undefined;
  };

  /**
   * Validates the input control.
   * @param control - The AbstractControl instance.
   * @returns ValidationErrors if value is null.
   */
  validate = (): ValidationErrors | null => {
    // if no value update validation with required
    if (!this.value || this.value === '') {
      return { required: true };
    }
    return null;
  };
}
