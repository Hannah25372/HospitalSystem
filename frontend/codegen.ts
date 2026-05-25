import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'http://localhost:4000/graphql',
  documents: ['src/**/*.graphql'],
  generates: {
    'src/graphql/__generated__/': {
      preset: 'client',
      config: { useTypeImports: true },
    },
  },
};

export default config;
