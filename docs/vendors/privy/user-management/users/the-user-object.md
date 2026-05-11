> ## Documentation Index
> Fetch the complete documentation index at: https://docs.privy.io/llms.txt
> Use this file to discover all available pages before exploring further.

# Handling the user object

All of Privy's login methods result in a unified JSON representation of your user.

<View title="React" icon="react">
  **To get the current user, inspect the [`user`](/user-management/users/the-user-object) object returned by the `usePrivy` hook:**

  ```tsx  theme={"system"}
  const { user } = usePrivy();
  ```

  ### Unauthenticated users

  For **unauthenticated** users, the [**`user`**](/user-management/users/the-user-object) object will be `null`.

  ### Authenticated users

  For **authenticated** users, you can use the following fields:

  <Expandable title="User" defaultOpen={true}>
    <ParamField body="id" type="string" required>
      The Privy-issued DID for the user. If you need to store additional information about a user, you
      can use this DID to reference them.
    </ParamField>

    <ParamField body="createdAt" type="string" required>
      The datetime of when the user was created, in ISO 8601 format.
    </ParamField>

    <ParamField body="linkedAccounts" type="array" required>
      The list of accounts associated with this user. Each account contains additional metadata that may
      be helpful for advanced use cases.

      <Expandable title="Properties">
        <Expandable title="Wallet">
          <ParamField body="type" type="'wallet'" required>
            Denotes that this is a wallet account
          </ParamField>

          <ParamField body="id" type="string | null" required>
            The wallet ID of the wallet. Null if the wallet is not delegated. Only applies to embedded
            wallets (walletClientType === 'privy')
          </ParamField>

          <ParamField body="address" type="string" required>
            The wallet address
          </ParamField>

          <ParamField body="chainType" type="'ethereum' | 'solana'" required>
            Chain type of the wallet address
          </ParamField>

          <ParamField body="walletClientType" type="string" required>
            The wallet client used for this wallet during the most recent verification. If the value is
            'privy', then this is a privy embedded wallet
          </ParamField>

          <ParamField body="connectorType" type="string" required>
            The connector type used for this wallet during the most recent verification
          </ParamField>

          <ParamField body="recoveryMethod" type="'privy' | UserRecoveryMethod" required>
            If this is a 'privy' embedded wallet, stores the recovery method
          </ParamField>

          <ParamField body="imported" type="boolean" required>
            Whether the wallet is imported. Only applies to embedded wallets (walletClientType === 'privy')
          </ParamField>

          <ParamField body="delegated" type="boolean" required>
            Whether the wallet is delegated. Only applies to embedded wallets (walletClientType === 'privy')
          </ParamField>

          <ParamField body="walletIndex" type="number | null" required>
            HD index for the wallet. Only applies to embedded wallets (walletClientType === 'privy')
          </ParamField>
        </Expandable>

        <Expandable title="SmartWallet">
          <ParamField body="type" type="'smart_wallet'" required>
            Denotes that this is a smart wallet account
          </ParamField>

          <ParamField body="address" type="string" required>
            The wallet address
          </ParamField>

          <ParamField body="smartWalletType" type="SmartWalletType" required>
            The provider of the smart wallet
          </ParamField>
        </Expandable>

        <Expandable title="Email">
          <ParamField body="type" type="'email'" required>
            Denotes that this is an email account
          </ParamField>

          <ParamField body="address" type="string" required>
            The email address
          </ParamField>
        </Expandable>

        <Expandable title="Phone">
          <ParamField body="type" type="'phone'" required>
            Denotes that this is a phone account
          </ParamField>

          <ParamField body="number" type="string" required>
            The phone number
          </ParamField>
        </Expandable>

        <Expandable title="Google">
          <ParamField body="type" type="'google_oauth'" required>
            Denotes that this is a Google account
          </ParamField>

          <ParamField body="subject" type="string" required>
            The 'sub' claim from the Google-issued JWT for this account
          </ParamField>

          <ParamField body="email" type="string" required>
            The email associated with the Google account
          </ParamField>

          <ParamField body="name" type="string | null" required>
            The name associated with the Google account
          </ParamField>
        </Expandable>

        <Expandable title="Twitter">
          <ParamField body="type" type="'twitter_oauth'" required>
            Denotes that this is a Twitter account
          </ParamField>

          <ParamField body="subject" type="string" required>
            The 'sub' claim from the Twitter-issued JWT for this account
          </ParamField>

          <ParamField body="username" type="string | null" required>
            The username associated with the Twitter account
          </ParamField>

          <ParamField body="name" type="string | null" required>
            The name associated with the Twitter account
          </ParamField>

          <ParamField body="profilePictureUrl" type="string | null" required>
            The profile picture URL associated with the Twitter account
          </ParamField>
        </Expandable>

        <Expandable title="Discord">
          <ParamField body="type" type="'discord_oauth'" required>
            Denotes that this is a Discord account
          </ParamField>

          <ParamField body="subject" type="string" required>
            The 'sub' claim from the Discord-issued JWT for this account
          </ParamField>

          <ParamField body="username" type="string | null" required>
            The username associated with the Discord account
          </ParamField>

          <ParamField body="email" type="string | null" required>
            The email associated with the Discord account
          </ParamField>
        </Expandable>

        <Expandable title="Github">
          <ParamField body="type" type="'github_oauth'" required>
            Denotes that this is a Github account
          </ParamField>

          <ParamField body="subject" type="string" required>
            The 'sub' claim from the Github-issued JWT for this account
          </ParamField>

          <ParamField body="username" type="string | null" required>
            The username associated with the Github account
          </ParamField>

          <ParamField body="name" type="string | null" required>
            The name associated with the Github account
          </ParamField>

          <ParamField body="email" type="string | null" required>
            The email associated with the Github account
          </ParamField>
        </Expandable>

        <Expandable title="Spotify">
          <ParamField body="type" type="'spotify_oauth'" required>
            Denotes that this is a Spotify account
          </ParamField>

          <ParamField body="subject" type="string" required>
            The user id associated with the Spotify account
          </ParamField>

          <ParamField body="email" type="string | null" required>
            The email associated with the Spotify account
          </ParamField>

          <ParamField body="name" type="string | null" required>
            The display name associated with the Spotify account
          </ParamField>
        </Expandable>

        <Expandable title="Instagram">
          <ParamField body="type" type="'instagram_oauth'" required>
            Denotes that this is an Instagram account
          </ParamField>

          <ParamField body="subject" type="string" required>
            The user id associated with the Instagram account
          </ParamField>

          <ParamField body="username" type="string | null" required>
            The username associated with the Instagram account
          </ParamField>
        </Expandable>

        <Expandable title="Tiktok">
          <ParamField body="type" type="'tiktok_oauth'" required>
            Denotes that this is a Tiktok account
          </ParamField>

          <ParamField body="subject" type="string" required>
            The 'sub' claim from the Tiktok-issued JWT for this account
          </ParamField>

          <ParamField body="username" type="string | null" required>
            The username associated with the Tiktok account
          </ParamField>

          <ParamField body="name" type="string | null" required>
            The display name associated with the Tiktok account
          </ParamField>
        </Expandable>

        <Expandable title="Line">
          <ParamField body="type" type="'line_oauth'" required>
            Denotes that this is a Line account
          </ParamField>

          <ParamField body="subject" type="string" required>
            The 'sub' claim from the Line-issued JWT for this account
          </ParamField>

          <ParamField body="name" type="string | null" required>
            The name associated with the Line account
          </ParamField>

          <ParamField body="email" type="string | null" required>
            The email associated with the Line account
          </ParamField>

          <ParamField body="profilePictureUrl" type="string | null" required>
            The profile image URL associated with the Line account
          </ParamField>
        </Expandable>

        <Expandable title="LinkedIn">
          <ParamField body="type" type="'linkedin_oauth'" required>
            Denotes that this is a LinkedIn account
          </ParamField>

          <ParamField body="subject" type="string" required>
            The 'sub' claim from the LinkedIn-issued JWT for this account
          </ParamField>

          <ParamField body="name" type="string | null" required>
            The name associated with the LinkedIn account
          </ParamField>

          <ParamField body="email" type="string | null" required>
            The email associated with the LinkedIn account
          </ParamField>

          <ParamField body="vanityName" type="string | null" required>
            The vanityName/profile URL associated with the LinkedIn account
          </ParamField>
        </Expandable>

        <Expandable title="Apple">
          <ParamField body="type" type="'apple_oauth'" required>
            Denotes that this is an Apple account
          </ParamField>

          <ParamField body="subject" type="string" required>
            The 'sub' claim from the Apple-issued JWT for this account
          </ParamField>

          <ParamField body="email" type="string" required>
            The email associated with the Apple account
          </ParamField>
        </Expandable>

        <Expandable title="CustomJwt">
          <ParamField body="type" type="'custom_auth'" required>
            Denotes that this is a custom account
          </ParamField>

          <ParamField body="customUserId" type="string" required>
            The user ID given by the custom auth provider
          </ParamField>
        </Expandable>

        <Expandable title="Farcaster">
          <ParamField body="type" type="'farcaster'" required>
            Denotes that this is a Farcaster account
          </ParamField>

          <ParamField body="fid" type="number | null" required>
            The Farcaster on-chain FID
          </ParamField>

          <ParamField body="ownerAddress" type="string" required>
            The Farcaster ethereum address that owns the FID
          </ParamField>

          <ParamField body="username" type="string | null" required>
            The Farcaster protocol username
          </ParamField>

          <ParamField body="displayName" type="string | null" required>
            The Farcaster protocol display name
          </ParamField>

          <ParamField body="bio" type="string | null" required>
            The Farcaster protocol bio
          </ParamField>

          <ParamField body="pfp" type="string | null" required>
            The Farcaster protocol profile picture
          </ParamField>

          <ParamField body="url" type="string | null" required>
            The Farcaster protocol profile url
          </ParamField>

          <ParamField body="signerPublicKey" type="string | null" required>
            The public key of the signer, if set. This is not guaranteed to be valid, as the user can revoke
            the key at any time
          </ParamField>
        </Expandable>

        <Expandable title="Passkey">
          <ParamField body="type" type="'passkey'" required>
            Denotes that this is a Passkey account
          </ParamField>

          <ParamField body="credentialId" type="string" required>
            The passkey credential ID
          </ParamField>

          <ParamField body="enrolledInMfa" type="boolean" required>
            Whether or not this passkey can be used for MFA
          </ParamField>

          <ParamField body="authenticatorName" type="string" required>
            The type of authenticator holding the passkey
          </ParamField>

          <ParamField body="createdWithDevice" type="string" required>
            Metadata about the device that registered the passkey
          </ParamField>

          <ParamField body="createdWithOs" type="string" required>
            Metadata about the OS that registered the passkey
          </ParamField>

          <ParamField body="createdWithBrowser" type="string" required>
            Metadata about the browser that registered the passkey
          </ParamField>
        </Expandable>

        <Expandable title="Telegram">
          <ParamField body="type" type="'telegram'" required>
            Denotes that this is a Telegram account
          </ParamField>

          <ParamField body="telegramUserId" type="string" required>
            The user ID that owns this Telegram account
          </ParamField>

          <ParamField body="firstName" type="string | null" required>
            The first name of the user
          </ParamField>

          <ParamField body="lastName" type="string | null" required>
            The last name of the user
          </ParamField>

          <ParamField body="username" type="string | null" required>
            The username associated with the Telegram account
          </ParamField>

          <ParamField body="photoUrl" type="string | null" required>
            The url of the user's profile picture
          </ParamField>
        </Expandable>

        <Expandable title="CrossApp">
          <ParamField body="type" type="'cross_app'" required>
            Denotes that this is a cross-app account
          </ParamField>

          <ParamField body="embeddedWallets" type="{ address: string }[]" required>
            The user's embedded wallet address(es) from the provider app
          </ParamField>

          <ParamField body="smartWallets" type="{ address: string }[]" required>
            The user's smart wallet address(es) from the provider app
          </ParamField>

          <ParamField body="providerApp" type="ProviderAppMetadata" required>
            Metadata about the provider app
          </ParamField>

          <ParamField body="subject" type="string" required>
            The subject identifier for this cross-app account
          </ParamField>
        </Expandable>

        {/*

          <Expandable title="AuthorizationKey">

          <ParamField body="type" type="'authorization_key'" required>
            Denotes that this is an authorization key
          </ParamField>
          <ParamField body="publicKey" type="string" required>
            The public key of the authorization key
          </ParamField>
          </Expandable> 
          */}

        <br />
      </Expandable>
    </ParamField>

    <ParamField body="mfaMethods" type="array" required>
      The list of MFA Methods associated with this user.
    </ParamField>

    <ParamField body="hasAcceptedTerms" type="boolean" required>
      Whether or not the user has explicitly accepted the Terms and Conditions and/or Privacy Policy
    </ParamField>

    <ParamField body="isGuest" type="boolean" required>
      Whether or not the user is a guest
    </ParamField>

    <Expandable title="Optional fields">
      <ParamField body="email" type="object">
        The user's email address, if they have linked one. It cannot be linked to another user.

        <Expandable title="Properties">
          <ParamField body="address" type="string">
            The email address.
          </ParamField>
        </Expandable>
      </ParamField>

      <ParamField body="phone" type="object">
        The user's phone number, if they have linked one. It cannot be linked to another user.

        <Expandable title="Properties">
          <ParamField body="number" type="string">
            The phone number.
          </ParamField>
        </Expandable>
      </ParamField>

      <ParamField body="wallet" type="object">
        The user's first verified wallet, if they have linked at least one wallet. It cannot be linked to
        another user.
      </ParamField>

      <ParamField body="smartWallet" type="object">
        The user's smart wallet, if they have set up through the Privy Smart Wallet SDK.

        <Expandable title="Properties">
          <ParamField body="address" type="string">
            The wallet address.
          </ParamField>

          <ParamField body="smartWalletType" type="string">
            The provider of the smart wallet.
          </ParamField>
        </Expandable>
      </ParamField>

      <ParamField body="google" type="object">
        The user's Google account, if they have linked one. It cannot be linked to another user.

        <Expandable title="Properties">
          <ParamField body="subject" type="string">
            The `sub` claim from the Google-issued JWT for this account.
          </ParamField>

          <ParamField body="email" type="string">
            The email associated with the Google account.
          </ParamField>

          <ParamField body="name" type="string">
            The name associated with the Google account.
          </ParamField>
        </Expandable>
      </ParamField>

      <ParamField body="twitter" type="object">
        The user's Twitter account, if they have linked one. It cannot be linked to another user.

        <Expandable title="Properties">
          <ParamField body="subject" type="string">
            The `sub` claim from the Twitter-issued JWT for this account.
          </ParamField>

          <ParamField body="username" type="string">
            The username associated with the Twitter account.
          </ParamField>

          <ParamField body="name" type="string">
            The name associated with the Twitter account.
          </ParamField>

          <ParamField body="profilePictureUrl" type="string">
            The profile picture URL associated with the Twitter account.
          </ParamField>
        </Expandable>
      </ParamField>

      <ParamField body="discord" type="object">
        The user's Discord account, if they have linked one. It cannot be linked to another user.

        <Expandable title="Properties">
          <ParamField body="subject" type="string">
            The `sub` claim from the Discord-issued JWT for this account.
          </ParamField>

          <ParamField body="username" type="string">
            The username associated with the Discord account.
          </ParamField>

          <ParamField body="email" type="string">
            The email associated with the Discord account.
          </ParamField>
        </Expandable>
      </ParamField>

      <ParamField body="github" type="object">
        The user's Github account, if they have linked one. It cannot be linked to another user.

        <Expandable title="Properties">
          <ParamField body="subject" type="string">
            The `sub` claim from the Github-issued JWT for this account.
          </ParamField>

          <ParamField body="username" type="string">
            The username associated with the Github account.
          </ParamField>

          <ParamField body="name" type="string">
            The name associated with the Github account.
          </ParamField>

          <ParamField body="email" type="string">
            The email associated with the Github account.
          </ParamField>
        </Expandable>
      </ParamField>

      <ParamField body="spotify" type="object">
        The user's Spotify account, if they have linked one. It cannot be linked to another user.

        <Expandable title="Properties">
          <ParamField body="subject" type="string">
            The user id associated with the Spotify account.
          </ParamField>

          <ParamField body="email" type="string">
            The email associated with the Spotify account.
          </ParamField>

          <ParamField body="name" type="string">
            The display name associated with the Spotify account.
          </ParamField>
        </Expandable>
      </ParamField>

      <ParamField body="instagram" type="object">
        The user's Instagram account, if they have linked one. It cannot be linked to another user.

        <Expandable title="Properties">
          <ParamField body="subject" type="string">
            The user id associated with the Instagram account.
          </ParamField>

          <ParamField body="username" type="string">
            The username associated with the Instagram account.
          </ParamField>
        </Expandable>
      </ParamField>

      <ParamField body="tiktok" type="object">
        The user's Tiktok account, if they have linked one. It cannot be linked to another user.

        <Expandable title="Properties">
          <ParamField body="subject" type="string">
            The `sub` claim from the Tiktok-issued JWT for this account.
          </ParamField>

          <ParamField body="username" type="string">
            The username associated with the Tiktok account.
          </ParamField>

          <ParamField body="name" type="string">
            The display name associated with the Tiktok account.
          </ParamField>
        </Expandable>
      </ParamField>

      <ParamField body="line" type="object">
        The user's Line account, if they have linked one. It cannot be linked to another user.

        <Expandable title="Properties">
          <ParamField body="subject" type="string">
            The `sub` claim from the Line-issued JWT for this account.
          </ParamField>

          <ParamField body="name" type="string">
            The name associated with the Line account.
          </ParamField>

          <ParamField body="email" type="string">
            The email associated with the Line account.
          </ParamField>

          <ParamField body="profilePictureUrl" type="string">
            The profile image URL associated with the Line account.
          </ParamField>
        </Expandable>
      </ParamField>

      <ParamField body="linkedin" type="object">
        The user's LinkedIn account, if they have linked one. It cannot be linked to another user.

        <Expandable title="Properties">
          <ParamField body="subject" type="string">
            The `sub` claim from the LinkedIn-issued JWT for this account.
          </ParamField>

          <ParamField body="name" type="string">
            The name associated with the LinkedIn account.
          </ParamField>

          <ParamField body="email" type="string">
            The email associated with the LinkedIn account.
          </ParamField>

          <ParamField body="vanityName" type="string">
            The vanityName/profile URL associated with the LinkedIn account.
          </ParamField>
        </Expandable>
      </ParamField>

      <ParamField body="apple" type="object">
        The user's Apple account, if they have linked one. It cannot be linked to another user.

        <Expandable title="Properties">
          <ParamField body="subject" type="string">
            The `sub` claim from the Apple-issued JWT for this account.
          </ParamField>

          <ParamField body="email" type="string">
            The email associated with the Apple account.
          </ParamField>
        </Expandable>
      </ParamField>

      <ParamField body="farcaster" type="object">
        The user's Farcaster account, if they have linked one. It cannot be linked to another user.

        <Expandable title="Properties">
          <ParamField body="fid" type="number">
            The Farcaster on-chain FID
          </ParamField>

          <ParamField body="ownerAddress" type="string">
            The Farcaster ethereum address that owns the FID
          </ParamField>

          <ParamField body="username" type="string">
            The Farcaster protocol username
          </ParamField>

          <ParamField body="displayName" type="string">
            The Farcaster protocol display name
          </ParamField>

          <ParamField body="bio" type="string">
            The Farcaster protocol bio
          </ParamField>

          <ParamField body="pfp" type="string">
            The Farcaster protocol profile picture
          </ParamField>

          <ParamField body="url" type="string">
            The Farcaster protocol profile url
          </ParamField>

          <ParamField body="signerPublicKey" type="string">
            The public key of the signer, if set. This is not guaranteed to be valid, as the user can
            revoke the key at any time
          </ParamField>
        </Expandable>
      </ParamField>

      <ParamField body="telegram" type="object">
        The user's Telegram account, if they have linked one. It cannot be linked to another user.

        <Expandable title="Properties">
          <ParamField body="telegramUserId" type="string">
            The user ID that owns this Telegram account.
          </ParamField>

          <ParamField body="firstName" type="string">
            The first name of the user.
          </ParamField>

          <ParamField body="lastName" type="string">
            The last name of the user.
          </ParamField>

          <ParamField body="username" type="string">
            The username associated with the Telegram account.
          </ParamField>

          <ParamField body="photoUrl" type="string">
            The url of the user's profile picture.
          </ParamField>
        </Expandable>
      </ParamField>

      <ParamField body="customMetadata" type="object">
        Custom metadata field for a given user account
      </ParamField>
    </Expandable>

    <br />
  </Expandable>

  <Tip>
    You can set custom metadata for a user via Privy's backend [server SDK and/or
    API endpoints](/user-management/users/custom-metadata).
  </Tip>

  If a user has not linked an account of a given type, the corresponding field on the [`user`](/user-management/users/the-user-object) object will be undefined.

  <Tip>
    Users can have multiple passkeys linked to their account. To find all linked
    passkeys, use the `linkedAccounts` list and filter by `passkey` account type.
  </Tip>

  Below is an example of how you might use the [**`user`**](/user-management/users/the-user-object) object in a minimal user profile:

  ```tsx Example User Profile theme={"system"}
  import { usePrivy } from "@privy-io/react-auth";

  function User() {
  const { ready, authenticated, user } = usePrivy();

  // Show nothing if user is not authenticated or data is still loading
  if (!(ready && authenticated) || !user) {
      return null;
  }

  return (
      <div>
      <p>User {user.id} has linked the following accounts:</p>
      <ul>
          <li>Apple: {user.apple ? user.apple.email : "None"}</li>
          <li>Discord: {user.discord ? user.discord.username : "None"}</li>
          <li>Email: {user.email ? user.email.address : "None"}</li>
          <li>Farcaster: {user.farcaster ? user.farcaster.username : "None"}</li>
          <li>GitHub: {user.github ? user.github.username : "None"}</li>
          <li>Google: {user.google ? user.google.email : "None"}</li>
          <li>Instagram: {user.instagram ? user.instagram.username : "None"}</li>
          <li>LinkedIn: {user.linkedin ? user.linkedin.email : "None"}</li>
          <li>Line: {user.line ? user.line.email : "None"}</li>
          <li>Phone: {user.phone ? user.phone.number : "None"}</li>
          <li>Spotify: {user.spotify ? user.spotify.email : "None"}</li>
          <li>Telegram: {user.telegram ? user.telegram.username : "None"}</li>
          <li>TikTok: {user.tiktok ? user.tiktok.username : "None"}</li>
          <li>Twitter: {user.twitter ? user.twitter.username : "None"}</li>
          <li>Wallet: {user.wallet ? user.wallet.address : "None"}</li>
      </ul>
      </div>
  );
  }
  ```

  ### Refreshing the `user` object

  In order to update a `user` object after any type of backend update, (i.e. [unlinking an account](/user-management/users/unlinking-accounts) or setting [custom metadata](/user-management/users/custom-metadata)) you can ensure the user object in the application is up-to-date by invoking the **`refreshUser`** method from the **`useUser`** hook:

  ```tsx Example refresh User theme={"system"}
  import { useUser } from "@privy-io/react-auth";

  const { user, refreshUser } = useUser();

  const updateMetadata = async (value: string) => {
  // Make API request to update custom metadata for a user from the backend
  const response = await updateUserMetadata({ value });
  await refreshUser();
  // `user` object should be updated
  console.log(user);
  };
  ```
</View>

<View title="React Native" icon="react">
  **You can get information about the current user from the `user` object in the `usePrivy` hook:**

  ```tsx  theme={"system"}
  const {user} = usePrivy();
  ```

  **For unauthenticated users, the `user` object will be null. For authenticated users, you can use:**

  * **`user.id`** to get their Privy DID, which you may use to identify your user on your backend
  * **`user.created_at`** to get a UNIX timestamp of when the user was created.
  * **`user.linked_accounts`** to get an array of the user's linked accounts

  ## Parsing linked accounts

  Each entry in the `linked_accounts` array has different fields depending on the user data associated with that account type.

  See the dropdowns below to see the specific fields associated with each account type.

  ### Refreshing the `user` object

  In order to update a `user` object after any type of backend update, (i.e. [unlinking an account](/user-management/users/unlinking-accounts) or setting [custom metadata](/user-management/users/custom-metadata)) you can ensure the user object in the application is up-to-date by invoking the **`get`** method from the **`privyClient.user`** object:

  <Tabs>
    <Tab title="_layout.tsx">
      ```tsx  theme={"system"}
      import { createPrivyClient, PrivyProvider } from "@privy-io/expo";

      export const privyClient = createPrivyClient({
        appId: "your-app-id",
      })

      export default function RootLayout() {
        return (
          <PrivyProvider
            appId={Constants.expoConfig?.extra?.privyAppId}
            client={privyClient}
          >
            <Stack>
              <Stack.Screen name="index" />
            </Stack>
          </PrivyProvider>
        );
      }
      ```
    </Tab>

    <Tab title="index.tsx">
      ```tsx  theme={"system"}
      import {privyClient} from '@/_layout';

      const updateMetadata = async (value: string) => {
      // Make API request to update custom metadata for a user from the backend
      const response = await updateUserMetadata({ value });

      // Refresh the user object to ensure it reflects the latest backend updates
      await privyClient.user.get();
      // `user` object should be updated
      };
      ```
    </Tab>
  </Tabs>

  <Expandable title="Wallet">
    <ParamField body="type" type="'wallet'" required>
      Denotes that this is a wallet account
    </ParamField>

    <ParamField body="id" type="string | null" required>
      The wallet ID of the wallet. Null if the wallet is not delegated. Only applies to embedded
      wallets (walletClientType === 'privy')
    </ParamField>

    <ParamField body="address" type="string" required>
      The wallet address
    </ParamField>

    <ParamField body="chainType" type="'ethereum' | 'solana'" required>
      Chain type of the wallet address
    </ParamField>

    <ParamField body="walletClientType" type="string" required>
      The wallet client used for this wallet during the most recent verification. If the value is
      'privy', then this is a privy embedded wallet
    </ParamField>

    <ParamField body="connectorType" type="string" required>
      The connector type used for this wallet during the most recent verification
    </ParamField>

    <ParamField body="recoveryMethod" type="'privy' | UserRecoveryMethod" required>
      If this is a 'privy' embedded wallet, stores the recovery method
    </ParamField>

    <ParamField body="imported" type="boolean" required>
      Whether the wallet is imported. Only applies to embedded wallets (walletClientType === 'privy')
    </ParamField>

    <ParamField body="delegated" type="boolean" required>
      Whether the wallet is delegated. Only applies to embedded wallets (walletClientType === 'privy')
    </ParamField>

    <ParamField body="walletIndex" type="number | null" required>
      HD index for the wallet. Only applies to embedded wallets (walletClientType === 'privy')
    </ParamField>
  </Expandable>

  <Expandable title="SmartWallet">
    <ParamField body="type" type="'smart_wallet'" required>
      Denotes that this is a smart wallet account
    </ParamField>

    <ParamField body="address" type="string" required>
      The wallet address
    </ParamField>

    <ParamField body="smartWalletType" type="SmartWalletType" required>
      The provider of the smart wallet
    </ParamField>
  </Expandable>

  <Expandable title="Email">
    <ParamField body="type" type="'email'" required>
      Denotes that this is an email account
    </ParamField>

    <ParamField body="address" type="string" required>
      The email address
    </ParamField>
  </Expandable>

  <Expandable title="Phone">
    <ParamField body="type" type="'phone'" required>
      Denotes that this is a phone account
    </ParamField>

    <ParamField body="number" type="string" required>
      The phone number
    </ParamField>
  </Expandable>

  <Expandable title="Google">
    <ParamField body="type" type="'google_oauth'" required>
      Denotes that this is a Google account
    </ParamField>

    <ParamField body="subject" type="string" required>
      The 'sub' claim from the Google-issued JWT for this account
    </ParamField>

    <ParamField body="email" type="string" required>
      The email associated with the Google account
    </ParamField>

    <ParamField body="name" type="string | null" required>
      The name associated with the Google account
    </ParamField>
  </Expandable>

  <Expandable title="Twitter">
    <ParamField body="type" type="'twitter_oauth'" required>
      Denotes that this is a Twitter account
    </ParamField>

    <ParamField body="subject" type="string" required>
      The 'sub' claim from the Twitter-issued JWT for this account
    </ParamField>

    <ParamField body="username" type="string | null" required>
      The username associated with the Twitter account
    </ParamField>

    <ParamField body="name" type="string | null" required>
      The name associated with the Twitter account
    </ParamField>

    <ParamField body="profilePictureUrl" type="string | null" required>
      The profile picture URL associated with the Twitter account
    </ParamField>
  </Expandable>

  <Expandable title="Discord">
    <ParamField body="type" type="'discord_oauth'" required>
      Denotes that this is a Discord account
    </ParamField>

    <ParamField body="subject" type="string" required>
      The 'sub' claim from the Discord-issued JWT for this account
    </ParamField>

    <ParamField body="username" type="string | null" required>
      The username associated with the Discord account
    </ParamField>

    <ParamField body="email" type="string | null" required>
      The email associated with the Discord account
    </ParamField>
  </Expandable>

  <Expandable title="Github">
    <ParamField body="type" type="'github_oauth'" required>
      Denotes that this is a Github account
    </ParamField>

    <ParamField body="subject" type="string" required>
      The 'sub' claim from the Github-issued JWT for this account
    </ParamField>

    <ParamField body="username" type="string | null" required>
      The username associated with the Github account
    </ParamField>

    <ParamField body="name" type="string | null" required>
      The name associated with the Github account
    </ParamField>

    <ParamField body="email" type="string | null" required>
      The email associated with the Github account
    </ParamField>
  </Expandable>

  <Expandable title="Spotify">
    <ParamField body="type" type="'spotify_oauth'" required>
      Denotes that this is a Spotify account
    </ParamField>

    <ParamField body="subject" type="string" required>
      The user id associated with the Spotify account
    </ParamField>

    <ParamField body="email" type="string | null" required>
      The email associated with the Spotify account
    </ParamField>

    <ParamField body="name" type="string | null" required>
      The display name associated with the Spotify account
    </ParamField>
  </Expandable>

  <Expandable title="Instagram">
    <ParamField body="type" type="'instagram_oauth'" required>
      Denotes that this is an Instagram account
    </ParamField>

    <ParamField body="subject" type="string" required>
      The user id associated with the Instagram account
    </ParamField>

    <ParamField body="username" type="string | null" required>
      The username associated with the Instagram account
    </ParamField>
  </Expandable>

  <Expandable title="Tiktok">
    <ParamField body="type" type="'tiktok_oauth'" required>
      Denotes that this is a Tiktok account
    </ParamField>

    <ParamField body="subject" type="string" required>
      The 'sub' claim from the Tiktok-issued JWT for this account
    </ParamField>

    <ParamField body="username" type="string | null" required>
      The username associated with the Tiktok account
    </ParamField>

    <ParamField body="name" type="string | null" required>
      The display name associated with the Tiktok account
    </ParamField>
  </Expandable>

  <Expandable title="Line">
    <ParamField body="type" type="'line_oauth'" required>
      Denotes that this is a Line account
    </ParamField>

    <ParamField body="subject" type="string" required>
      The 'sub' claim from the Line-issued JWT for this account
    </ParamField>

    <ParamField body="name" type="string | null" required>
      The name associated with the Line account
    </ParamField>

    <ParamField body="email" type="string | null" required>
      The email associated with the Line account
    </ParamField>

    <ParamField body="profilePictureUrl" type="string | null" required>
      The profile image URL associated with the Line account
    </ParamField>
  </Expandable>

  <Expandable title="LinkedIn">
    <ParamField body="type" type="'linkedin_oauth'" required>
      Denotes that this is a LinkedIn account
    </ParamField>

    <ParamField body="subject" type="string" required>
      The 'sub' claim from the LinkedIn-issued JWT for this account
    </ParamField>

    <ParamField body="name" type="string | null" required>
      The name associated with the LinkedIn account
    </ParamField>

    <ParamField body="email" type="string | null" required>
      The email associated with the LinkedIn account
    </ParamField>

    <ParamField body="vanityName" type="string | null" required>
      The vanityName/profile URL associated with the LinkedIn account
    </ParamField>
  </Expandable>

  <Expandable title="Apple">
    <ParamField body="type" type="'apple_oauth'" required>
      Denotes that this is an Apple account
    </ParamField>

    <ParamField body="subject" type="string" required>
      The 'sub' claim from the Apple-issued JWT for this account
    </ParamField>

    <ParamField body="email" type="string" required>
      The email associated with the Apple account
    </ParamField>
  </Expandable>

  <Expandable title="CustomJwt">
    <ParamField body="type" type="'custom_auth'" required>
      Denotes that this is a custom account
    </ParamField>

    <ParamField body="customUserId" type="string" required>
      The user ID given by the custom auth provider
    </ParamField>
  </Expandable>

  <Expandable title="Farcaster">
    <ParamField body="type" type="'farcaster'" required>
      Denotes that this is a Farcaster account
    </ParamField>

    <ParamField body="fid" type="number | null" required>
      The Farcaster on-chain FID
    </ParamField>

    <ParamField body="ownerAddress" type="string" required>
      The Farcaster ethereum address that owns the FID
    </ParamField>

    <ParamField body="username" type="string | null" required>
      The Farcaster protocol username
    </ParamField>

    <ParamField body="displayName" type="string | null" required>
      The Farcaster protocol display name
    </ParamField>

    <ParamField body="bio" type="string | null" required>
      The Farcaster protocol bio
    </ParamField>

    <ParamField body="pfp" type="string | null" required>
      The Farcaster protocol profile picture
    </ParamField>

    <ParamField body="url" type="string | null" required>
      The Farcaster protocol profile url
    </ParamField>

    <ParamField body="signerPublicKey" type="string | null" required>
      The public key of the signer, if set. This is not guaranteed to be valid, as the user can revoke
      the key at any time
    </ParamField>
  </Expandable>

  <Expandable title="Passkey">
    <ParamField body="type" type="'passkey'" required>
      Denotes that this is a Passkey account
    </ParamField>

    <ParamField body="credentialId" type="string" required>
      The passkey credential ID
    </ParamField>

    <ParamField body="enrolledInMfa" type="boolean" required>
      Whether or not this passkey can be used for MFA
    </ParamField>

    <ParamField body="authenticatorName" type="string" required>
      The type of authenticator holding the passkey
    </ParamField>

    <ParamField body="createdWithDevice" type="string" required>
      Metadata about the device that registered the passkey
    </ParamField>

    <ParamField body="createdWithOs" type="string" required>
      Metadata about the OS that registered the passkey
    </ParamField>

    <ParamField body="createdWithBrowser" type="string" required>
      Metadata about the browser that registered the passkey
    </ParamField>
  </Expandable>

  <Expandable title="Telegram">
    <ParamField body="type" type="'telegram'" required>
      Denotes that this is a Telegram account
    </ParamField>

    <ParamField body="telegramUserId" type="string" required>
      The user ID that owns this Telegram account
    </ParamField>

    <ParamField body="firstName" type="string | null" required>
      The first name of the user
    </ParamField>

    <ParamField body="lastName" type="string | null" required>
      The last name of the user
    </ParamField>

    <ParamField body="username" type="string | null" required>
      The username associated with the Telegram account
    </ParamField>

    <ParamField body="photoUrl" type="string | null" required>
      The url of the user's profile picture
    </ParamField>
  </Expandable>

  <Expandable title="CrossApp">
    <ParamField body="type" type="'cross_app'" required>
      Denotes that this is a cross-app account
    </ParamField>

    <ParamField body="embeddedWallets" type="{ address: string }[]" required>
      The user's embedded wallet address(es) from the provider app
    </ParamField>

    <ParamField body="smartWallets" type="{ address: string }[]" required>
      The user's smart wallet address(es) from the provider app
    </ParamField>

    <ParamField body="providerApp" type="ProviderAppMetadata" required>
      Metadata about the provider app
    </ParamField>

    <ParamField body="subject" type="string" required>
      The subject identifier for this cross-app account
    </ParamField>
  </Expandable>

  {/*

    <Expandable title="AuthorizationKey">

    <ParamField body="type" type="'authorization_key'" required>
      Denotes that this is an authorization key
    </ParamField>
    <ParamField body="publicKey" type="string" required>
      The public key of the authorization key
    </ParamField>
    </Expandable> 
    */}

  <br />
</View>

<View title="Flutter" icon="flutter">
  Once a user has authenticated with Privy, you will have access to the `PrivyUser` object. This will be the main entry point for all user actions.

  ```dart  theme={"system"}
  abstract class PrivyUser {
    /// Unique identifier for the user.
    String get id;

    /// List of linked accounts associated with the user.
    List<LinkedAccounts> get linkedAccounts;

    /// List of embedded Ethereum wallets associated with the user.
    List<EmbeddedEthereumWallet> get embeddedEthereumWallets;

    /// List of embedded Solana wallets associated with the user.
    List<EmbeddedSolanaWallet> get embeddedSolanaWallets;

    /// Creates an Ethereum embedded wallet for the user.
    Future<Result<EmbeddedEthereumWallet>> createEthereumWallet(
        {bool allowAdditional = false});

    /// Creates a Solana embedded wallet for the user.
    Future<Result<EmbeddedSolanaWallet>> createSolanaWallet();
  }
  ```

  ## Linked accounts

  A user contains a list of LinkedAccounts, which are all account types associated with the user.

  ```dart  theme={"system"}
  /// A sealed class representing different types of linked accounts.
  sealed class LinkedAccount {}

  /// Represents a phone number-based linked account.
  class PhoneAccount extends LinkedAccount {}

  /// Represents an email-based linked account.
  class EmailAccount extends LinkedAccount {}

  /// Represents a custom authentication-linked account.
  class CustomAuth extends LinkedAccount {}

  /// Represents an Ethereum embedded wallet linked account.
  class EmbeddedEthereumWalletAccount extends LinkedAccount {}

  /// Represents a Solana embedded wallet linked account.
  class EmbeddedSolanaWalletAccount extends LinkedAccount {}
  ```

  ## Refreshing the `user` object

  To ensure the `user` object reflects the latest backend updates, invoke the **`refresh`** method on the user instance to synchronize it with the current data:

  ```dart  theme={"system"}
  final refreshResult = await privy.user?.refresh();
  ```

  If the refresh operation is successful, `refresh()` will return `Result.success` with no additional data.
  If an error occurs during the refresh operation, `refresh()` will return `Result.failure` with an encapsulated `PrivyException`.

  ***
</View>

<View title="Android" icon="android">
  Once a user has authenticated with Privy, you will have access to the `PrivyUser` object. This will be the main entry point for all user actions.

  ```kotlin  theme={"system"}
  public data class PrivyUser(
      // The user's Privy ID
      val id: String,

      // A list of all linked accounts - can be authentication methods or embedded wallets
      val linkedAccounts: List<LinkedAccount>,

      // A list of user's ethereum wallets
      val ethereumWallets: List<EmbeddedEthereumWallet>,

      // A list of the user's solana wallets
      val solanaWallets: List<EmbeddedSolanaWallet>

      // Refresh the user
      public suspend fun refresh(): Result<Unit>

      // Other user methods
  )

  public sealed interface LinkedAccount {
      public data class PhoneAccount(/* Account specific data */) : LinkedAccount

      public data class EmailAccount(/* Account specific data */) : LinkedAccount

      public data class CustomAuth(/* Account specific data */) : LinkedAccount

      public data class EmbeddedEthereumWalletAccount(/* Account specific data */) : LinkedAccount

      public data class EmbeddedSolanaWalletAccount(/* Account specific data */) : LinkedAccount

      // Other linked account types
  }
  ```
</View>

<View title="Swift" icon="swift">
  Once a user has authenticated with Privy, you will have access to the `PrivyUser` object. This will be the main entry point for all user actions.

  ```swift  theme={"system"}
  public protocol PrivyUser {
      /// The user's Privy ID
      var id: String { get }

      /// The user's ID token
      var identityToken: String? { get }

      /// The point in time at which the logged in user was created.
      /// Value will only be nil if there is no user currently logged in.
      var createdAt: Date? { get }

      // A list of all linked accounts - can be authentication methods or embedded wallets
      var linkedAccounts: [LinkedAccount] { get }

      // A list of user's ethereum wallets
      var embeddedEthereumWallets: [EmbeddedEthereumWallet] { get }

      // A list of the user's solana wallets
      var embeddedSolanaWallets: [EmbeddedSolanaWallet] { get }

      // Refresh the user
      func refresh() async throws

      // Returns the user's access token, but will first refresh the user session if needed.
      func getAccessToken() async throws -> String

      // Other user methods
  }

  public enum LinkedAccount {
      case phone(PhoneNumberAccount)
      case email(EmailAccount)
      case customAuth(CustomAuth)
      case embeddedEthereumWallet(EmbeddedEthereumWalletAccount)
      case embeddedSolanaWallet(EmbeddedSolanaWalletAccount)

  // Other linked account types
  }
  ```
</View>

<View title="Unity" icon="unity">
  Once your user has successfully authenticated, you can get a `PrivyUser` object containing their account data via:

  ```csharp  theme={"system"}
  // User will be null if no user is authenticated
  PrivyUser user = PrivyManager.Instance.User;
  ```

  The `PrivyUser` implements the interface below:

  ```csharp  theme={"system"}
  public interface IPrivyUser
  {
      // The user's ID
      string Id { get; }

      // List of the User's linked accounts
      PrivyLinkedAccount[] LinkedAccounts { get; }

      // A list of the user's embedded ethereum wallets
      IEmbeddedEthereumWallet[] EmbeddedWallets { get; }

      // A list of the user's embedded solana wallets
      IEmbeddedSolanaWallet[] EmbeddedSolanaWallets { get; }

      // Creates an embedded ethereum wallet for the user
      Task<IEmbeddedEthereumWallet> CreateWallet(bool allowAdditional = false);

      // Creates an embedded solana wallet for the user
      Task<IEmbeddedSolanaWallet> CreateSolanaWallet(bool allowAdditional = false);

      // Custom user metadata, stored as a set of key-value pairs.
      // This custom metadata is set server-side.
      Dictionary<string, string> CustomMetadata { get; }
  }
  ```

  <Warning>
    Make sure you subscribe to the [Authentication State Updates](/authentication/user-authentication/authentication-state) and avoid calling the `IPrivyUser` object without being Authenticated, as properties will return a default value otherwise.

    <Accordion title="See the default values for the PrivyUser when the user is not authenticated:">
      * `user.Id = ""`
      * `user.LinkedAccounts = []`
      * `user.EmbeddedWallets = []`
      * `user.CustomMetadata = new Dictionary()`
    </Accordion>
  </Warning>

  <Tip>
    You can set custom metadata for a user via Privy's backend [server SDK and/or API endpoints](/user-management/users/custom-metadata).
  </Tip>
</View>
\n