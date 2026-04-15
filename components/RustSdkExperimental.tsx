import { Callout } from 'nextra-theme-docs'

export function RustSdkExperimental() {
  return (
    <Callout type="warning">
      The Rust SDK is <strong>experimental</strong>. Support and bug fixes are low priority compared to the Python SDK.
      See <a href="https://crates.io/crates/genlayer_sdk">genlayer_sdk on crates.io</a> for the latest published version.
    </Callout>
  )
}
