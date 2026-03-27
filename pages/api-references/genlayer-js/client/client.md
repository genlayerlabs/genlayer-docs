[**genlayer-js**](../README.md)

***

[genlayer-js](../README.md) / client/client

# client/client

## Functions

### createClient()

> **createClient**(`config?`): [`GenLayerClient`](../types.md#genlayerclient)\<[`GenLayerChain`](../types.md#genlayerchain)\>

Defined in: [client/client.ts:94](https://github.com/genlayerlabs/genlayer-js/blob/b9e101b6f17a9f4fd0ee0f8f333cc2e8d9c55735/src/client/client.ts#L94)

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

Defined in: [client/client.ts:141](https://github.com/genlayerlabs/genlayer-js/blob/b9e101b6f17a9f4fd0ee0f8f333cc2e8d9c55735/src/client/client.ts#L141)

#### Parameters

##### chainConfig

[`GenLayerChain`](../types.md#genlayerchain)

##### customTransport

`Transport`

#### Returns

`object`
