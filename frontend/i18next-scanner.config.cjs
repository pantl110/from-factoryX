/** @type {import('i18next-scanner').UserConfig} */
module.exports = {
  input: [
    'src/**/*.{js,jsx,ts,tsx}',
    // Use ! to filter out files or directories
    '!src/**/*.spec.{js,jsx,ts,tsx}',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
  output: './',
  options: {
    debug: true,
    func: {
      // next-intl의 useTranslations()로 가져온 t 함수를 인식
      // 예: const t = useTranslations(); t('common.save')
      // 예: const t = useTranslations('namespace'); t('key')
      list: ['t', 'i18next.t', 'i18n.t'],
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    },
    trans: {
      component: 'Trans',
      i18nKey: 'i18nKey',
      defaultsKey: 'defaults',
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      fallbackKey: function (ns, value) {
        return value;
      },
      acorn: {
        ecmaVersion: 10,
        sourceType: 'module',
        allowHashBang: true,
      },
    },
    lngs: ['ko', 'en'],
    defaultLng: 'ko',
    // 번역되지 않은 문자열을 찾기 위한 기본값
    defaultValue: '__STRING_NOT_TRANSLATED__',
    resource: {
      loadPath: 'src/messages/{{lng}}.json',
      savePath: 'src/messages/{{lng}}.json',
      jsonIndent: 2,
      lineEnding: '\n',
    },
    nsSeparator: ':',
    keySeparator: '.',
    interpolation: {
      prefix: '{{',
      suffix: '}}',
    },
    // 기존 번역 키를 유지하면서 새로운 키만 추가
    keepRemoved: false,
    // 기존 번역 파일의 순서 유지
    sort: false,
  },
};

