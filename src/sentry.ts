import * as SentryExpo from 'sentry-expo'

SentryExpo.init({
  dsn: 'https://2ee085cec3774459876d706eac0fe6a5@o58488.ingest.sentry.io/4504039187742720',
  // dsn: 'https://39c1a6b78a794c479d6b716223e91f7b@o58488.ingest.sentry.io/125390',
  enableInExpoDevelopment: false,
  debug: __DEV__, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending the event. Set it to `false` in production
  // integrations: [
  //   new Sentry.ReactNativeTracing({
  //     tracePropagationTargets: ['localhost', /^\//],
  //     // ... other options
  //   }),
  // ],
})
