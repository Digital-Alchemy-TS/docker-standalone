import { TServiceParams } from '@digital-alchemy/core'

export function RuntimePrecedence({
  logger,
  context,
  config,
  synapse,
  hass,
  lifecycle,
}: TServiceParams) {
  // Whether this runtime is in development mode or not
  const isDevelop = config.homeAutomation.NODE_ENV === 'development'

  // When developing locally, the production runtime will pause and the development runtime will take over
  const isDevelopmentActive = synapse.switch({
    context,
    name: 'Whether or not local development takes over from production',
  })

  // Block outgoing commands and most incoming messages in prod when dev overrides it.
  isDevelopmentActive.onUpdate(() => {
    if (isDevelopmentActive.is_on) {
      logger.info('Development runtime takes over')
      hass.socket.pauseMessages = !isDevelop
    } else {
      logger.info('Resuming production runtime')
      hass.socket.pauseMessages = isDevelop
    }
  })

  // Update the state on startup
  isDevelopmentActive.is_on = isDevelop

  // Give the go ahead for production to take over again when shutting down
  lifecycle.onPreShutdown(() => {
    if (isDevelop) isDevelopmentActive.is_on = false
  })
}
