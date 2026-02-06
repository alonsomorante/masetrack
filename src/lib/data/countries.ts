export interface Country {
  code: string;
  name: string;
  prefix: string;
  flag: string;
  default?: boolean;
  phoneFormat: string;
  example: string;
}

export const COUNTRIES: Country[] = [
  { 
    code: 'PE', 
    name: 'Perú', 
    prefix: '+51', 
    flag: '🇵🇪', 
    default: true,
    phoneFormat: '999 999 999',
    example: '999 999 999'
  },
  { 
    code: 'US', 
    name: 'Estados Unidos', 
    prefix: '+1', 
    flag: '🇺🇸',
    phoneFormat: '(999) 999-9999',
    example: '(555) 123-4567'
  },
  { 
    code: 'MX', 
    name: 'México', 
    prefix: '+52', 
    flag: '🇲🇽',
    phoneFormat: '999 999 9999',
    example: '55 1234 5678'
  },
  { 
    code: 'CO', 
    name: 'Colombia', 
    prefix: '+57', 
    flag: '🇨🇴',
    phoneFormat: '999 9999999',
    example: '312 3456789'
  },
  { 
    code: 'AR', 
    name: 'Argentina', 
    prefix: '+54', 
    flag: '🇦🇷',
    phoneFormat: '99 9999-9999',
    example: '11 1234-5678'
  },
  { 
    code: 'CL', 
    name: 'Chile', 
    prefix: '+56', 
    flag: '🇨🇱',
    phoneFormat: '9 9999 9999',
    example: '9 1234 5678'
  },
  { 
    code: 'BR', 
    name: 'Brasil', 
    prefix: '+55', 
    flag: '🇧🇷',
    phoneFormat: '(99) 99999-9999',
    example: '(11) 91234-5678'
  },
  { 
    code: 'EC', 
    name: 'Ecuador', 
    prefix: '+593', 
    flag: '🇪🇨',
    phoneFormat: '99 999 9999',
    example: '98 123 4567'
  },
  { 
    code: 'VE', 
    name: 'Venezuela', 
    prefix: '+58', 
    flag: '🇻🇪',
    phoneFormat: '999 9999999',
    example: '412 1234567'
  },
  { 
    code: 'BO', 
    name: 'Bolivia', 
    prefix: '+591', 
    flag: '🇧🇴',
    phoneFormat: '99 999 9999',
    example: '77 123 4567'
  },
  { 
    code: 'UY', 
    name: 'Uruguay', 
    prefix: '+598', 
    flag: '🇺🇾',
    phoneFormat: '99 999 999',
    example: '99 123 456'
  },
  { 
    code: 'PY', 
    name: 'Paraguay', 
    prefix: '+595', 
    flag: '🇵🇾',
    phoneFormat: '999 999 999',
    example: '981 123 456'
  },
  { 
    code: 'CA', 
    name: 'Canadá', 
    prefix: '+1', 
    flag: '🇨🇦',
    phoneFormat: '(999) 999-9999',
    example: '(555) 123-4567'
  },
  { 
    code: 'GT', 
    name: 'Guatemala', 
    prefix: '+502', 
    flag: '🇬🇹',
    phoneFormat: '9999 9999',
    example: '5123 4567'
  },
  { 
    code: 'SV', 
    name: 'El Salvador', 
    prefix: '+503', 
    flag: '🇸🇻',
    phoneFormat: '9999 9999',
    example: '7123 4567'
  },
  { 
    code: 'HN', 
    name: 'Honduras', 
    prefix: '+504', 
    flag: '🇭🇳',
    phoneFormat: '9999-9999',
    example: '9123-4567'
  },
  { 
    code: 'NI', 
    name: 'Nicaragua', 
    prefix: '+505', 
    flag: '🇳🇮',
    phoneFormat: '9999 9999',
    example: '8123 4567'
  },
  { 
    code: 'CR', 
    name: 'Costa Rica', 
    prefix: '+506', 
    flag: '🇨🇷',
    phoneFormat: '9999 9999',
    example: '6123 4567'
  },
  { 
    code: 'PA', 
    name: 'Panamá', 
    prefix: '+507', 
    flag: '🇵🇦',
    phoneFormat: '9999-9999',
    example: '6123-4567'
  }
];

export const getDefaultCountry = (): Country => {
  return COUNTRIES.find(c => c.default) || COUNTRIES[0];
};

export const getCountryByCode = (code: string): Country | undefined => {
  return COUNTRIES.find(c => c.code === code);
};

export const formatPhoneNumber = (phone: string, countryCode: string): string => {
  const country = getCountryByCode(countryCode);
  if (!country) return phone;
  
  // Remove non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Add country prefix if not present
  if (!cleaned.startsWith(country.prefix.replace('+', ''))) {
    return country.prefix + cleaned;
  }
  
  return '+' + cleaned;
};

export const validatePhoneNumber = (phone: string, countryCode: string): boolean => {
  const country = getCountryByCode(countryCode);
  if (!country) return false;
  
  const cleaned = phone.replace(/\D/g, '');
  const prefix = country.prefix.replace('+', '');
  
  // Check if it starts with country code
  if (!cleaned.startsWith(prefix)) {
    return false;
  }
  
  // Remove country code and check length
  const numberWithoutPrefix = cleaned.substring(prefix.length);
  
  // Minimum 8 digits, maximum 12
  if (numberWithoutPrefix.length < 8 || numberWithoutPrefix.length > 12) {
    return false;
  }
  
  return true;
};
