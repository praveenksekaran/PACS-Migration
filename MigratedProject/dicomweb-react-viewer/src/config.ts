type AppConfig = {
  apiUrl?: string
  dataSources?: Array<{ configuration?: { qidoRoot?: string } }>
}

const cfg: AppConfig | undefined = (window as Window & { config?: AppConfig }).config

// Prefer the direct apiUrl field.
// Fallback: derive the base URL from the QIDO root injected by the server
// (server.js sets dataSources[0].configuration.qidoRoot = `${apiUrl}/rs`)
const fromDataSources: string =
  cfg?.dataSources?.[0]?.configuration?.qidoRoot?.replace(/\/rs$/, '') ?? ''

export const API_URL: string = cfg?.apiUrl ?? fromDataSources
