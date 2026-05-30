import type { GeneratorConfig } from 'ng-openapi';

const config: GeneratorConfig = {
  input: './artifacts/openapi.json',
  output: './src/app/api/generated/client',
  options: {
    enumStyle: 'enum',
    dateType: 'Date',
  },
};

export default config;
