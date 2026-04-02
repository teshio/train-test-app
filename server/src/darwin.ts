import * as soap from 'soap'

type OpenLdbClient = {
  // Darwin SOAP client method (shape comes from WSDL)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  GetDepBoardWithDetailsAsync: (args: any) => Promise<[any]>
  // Darwin SOAP client method (shape comes from WSDL)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  GetServiceDetailsAsync: (args: any) => Promise<[any]>
}

const WSDL_URL = 'https://lite.realtime.nationalrail.co.uk/OpenLDBWS/wsdl.aspx?ver=2021-11-01'

let cachedClient: OpenLdbClient | null = null

export async function getDarwinClient(token: string): Promise<OpenLdbClient> {
  if (cachedClient) return cachedClient

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client: any = await soap.createClientAsync(WSDL_URL, {
    disableCache: false,
  })

  // NRE Darwin SOAP expects an AccessToken header
  client.addSoapHeader({
    AccessToken: {
      TokenValue: token,
    },
  })

  cachedClient = client as OpenLdbClient
  return cachedClient
}

