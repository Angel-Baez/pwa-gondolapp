module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Tipos permitidos específicos para GondolApp
    'type-enum': [
      2,
      'always',
      [
        'feat', // Nueva funcionalidad
        'fix', // Corrección de bug
        'docs', // Documentación
        'style', // Formateo, espacios (sin cambios de lógica)
        'refactor', // Refactorización
        'perf', // Mejoras de performance
        'test', // Tests
        'chore', // Dependencias, configuración
        'revert', // Revertir cambios
        'pwa', // Configuraciones PWA específicas
        'offline', // Funcionalidad offline
        'mobile', // Optimizaciones móviles
      ],
    ],

    // Scopes permitidos específicos para GondolApp
    'scope-enum': [
      2,
      'always',
      [
        // Funcionalidades core
        'inventory', // Gestión de productos y stock
        'scanner', // Escaneo de códigos de barras
        'sync', // Sincronización offline/online
        'reports', // Reportes y análisis
        'notifications', // Sistema de alertas

        // Componentes técnicos
        'ui', // Componentes de interfaz
        'api', // Endpoints y lógica de API
        'db', // Acceso a datos y schemas
        'pwa', // Configuraciones PWA
        'config', // Configuración del proyecto

        // Testing y herramientas
        'test', // Testing general
        'e2e', // Tests end-to-end
        'ci', // Integración continua
        'deps', // Dependencias

        // Módulos específicos
        'auth', // Autenticación
        'cache', // Sistema de cache
        'workers', // Service workers
        'hooks', // Custom hooks
        'utils', // Utilidades
        'types', // Tipos TypeScript
        'components', // Componentes React
        'services', // Servicios de negocio
        'repositories', // Acceso a datos
      ],
    ],

    // Longitud del subject
    'subject-max-length': [2, 'always', 50],
    'subject-min-length': [2, 'always', 10],

    // Formato del subject
    'subject-case': [2, 'always', 'lower-case'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],

    // Header format
    'header-max-length': [2, 'always', 72],

    // Body format
    'body-leading-blank': [1, 'always'],
    'body-max-line-length': [2, 'always', 100],

    // Footer format
    'footer-leading-blank': [1, 'always'],
    'footer-max-line-length': [2, 'always', 100],
  },

  // Plugins para validaciones custom
  plugins: [
    {
      rules: {
        // Validar que ciertos scopes requieren ciertos tipos
        'scope-type-match': parsed => {
          const { type, scope } = parsed;

          // PWA changes should use 'pwa' type
          if (
            scope === 'pwa' &&
            type !== 'pwa' &&
            type !== 'feat' &&
            type !== 'fix'
          ) {
            return [false, 'PWA scope should use "pwa", "feat", or "fix" type'];
          }

          // Test files should use 'test' type
          if (scope === 'test' && type !== 'test') {
            return [false, 'Test scope should use "test" type'];
          }

          return [true];
        },
      },
    },
  ],
};
