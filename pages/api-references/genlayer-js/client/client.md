[**genlayer-js**](../README.md)

***

[genlayer-js](../README.md) / client/client

# client/client

## Functions

### createClient()

> **createClient**(`config?`): [`GenLayerClient`](../types.md#genlayerclient)\<[`GenLayerChain`](../types.md#genlayerchain)\>

Defined in: [client/client.ts:94](https://github.com/genlayerlabs/genlayer-js/blob/9d486ec4a7c75bfd7a8efaedef2a4238fab496a1/src/client/client.ts#L94)

Creates a GenLayer client instance for interacting with the network.

#### Parameters

##### config?

`ClientConfig` = `...`

Client configuration options

#### Returns

[`GenLayerClient`](../types.md#genlayerclient)\<[`GenLayerChain`](../types.md#genlayerchain)\>

Configured client with contract, transaction, and staking methods

***

### createPublicClient()

> **createPublicClient**(`chainConfig`, `customTransport`): `object`

Defined in: [client/client.ts:141](https://github.com/genlayerlabs/genlayer-js/blob/9d486ec4a7c75bfd7a8efaedef2a4238fab496a1/src/client/client.ts#L141)

#### Parameters

##### chainConfig

[`GenLayerChain`](../types.md#genlayerchain)

##### customTransport

`Transport`

#### Returns

`object`
