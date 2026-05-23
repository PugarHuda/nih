/**
 * Webpack alias target for @mezo-org/mezo-clay.
 *
 * mezo-clay.es.js inlines a pre-compiled react-jsx-runtime.production.min
 * that reads React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
 * .ReactCurrentOwner — an internal React 18 removed in React 19. Loading
 * that chunk in our app crashed every page that touched Passport.
 *
 * We never render any mezo-clay component (we only use Passport's
 * `getConfig` helper which doesn't need clay). So we stub the entire
 * package: every named import resolves to `undefined`, every default
 * import to an empty object. If Passport's UI is ever lazily loaded by
 * accident, it just no-ops instead of crashing.
 */
const stub: Record<string, unknown> = new Proxy(
  {},
  {
    get() {
      return undefined;
    },
  },
);

export default stub;
