import { db } from '../src/db'
import { buildFeeds } from '../src/routes/feeds'
import { zerion } from '../src/services/zerion'
import { simplehash } from '../src/services/simplehash'
import { neynar } from '../src/services/neynar'

const updateFeeds = async () => {
  const accounts = await db.socials.listFarcasterAccounts()
  for (const account of accounts) {
    console.log(`[feed] updating feeds for ${account.fid}`)
    await buildFeeds(account.fid)
  }
}

const updateTokens = async () => {
  const tokens = await db.tokens.list()
  for (const token of tokens) {
    console.log(`[token] updating token for ${token.id}`)
    const zerionToken = await zerion.getFungible(token.chain_id, token.address)
    const simpleHashToken = await simplehash.getFungible(token.chain_id, token.address)
    await db.tokens.update(token.id, {
      price_usd: zerionToken.attributes.market_data.price?.toFixed(8) ?? '0',
      market_cap: Math.round(zerionToken.attributes.market_data.market_cap ?? 0),
      total_supply: Math.round(zerionToken.attributes.market_data.total_supply ?? 0),
      holders: simpleHashToken.holder_count ?? 0,
    })
  }
}

const updateCommunities = async () => {
  const communities = await db.communities.list()
  for (const community of communities) {
    console.log(`[community] updating community for ${community.id}`)
    const posts = await db.posts.countForFid(community.fid)
    const followers =
      (community.farcaster?.follower_count ?? 0) + (community.twitter?.followers ?? 0)
    await db.communities.update(community.id, {
      posts,
      followers,
    })
  }
}

const updateFarcasterAccounts = async () => {
  const accounts = await db.socials.listFarcasterAccounts()
  const fids = accounts.map((account) => account.fid)
  const users = await neynar.getBulkUsersByFids(fids)
  for (const user of users.users) {
    console.log(`[farcaster] updating account for ${user.fid}`)
    await db.socials.updateFarcasterAccount(user.fid, {
      metadata: user,
    })
  }
}

const updateTwitterAccounts = async () => {
  const accounts = await db.socials.listTwitterAccounts()
  for (const account of accounts) {
    console.log(`[twitter] updating account for ${account.username}`)
    const response = await fetch(`https://api.fxtwitter.com/${account.username}`)
    const data: {
      code: number
      message: string
      user: {
        url: string
        id: string
        followers: number
        following: number
        likes: number
        tweets: number
        name: string
        screen_name: string
        description: string
        location: string
        banner_url: string
        avatar_url: string
        joined: string
        website: any
      }
    } = await response.json()

    await db.socials.updateTwitterAccount(account.username, {
      metadata: data.user,
    })
  }
}

const updateVaults = async () => {
  const vaults = await db.vaults.list()
  for (const vault of vaults) {
    console.log(`[vault] updating vault for ${vault.id}`)
    const posts = await db.vaults.countPosts(vault.id)
    await db.vaults.update(vault.id, {
      posts,
    })
  }
}

const main = async () => {
  let i = 0
  while (true) {
    try {
      await updateFeeds()
      await updateCommunities()
      if (i % 10 === 0) {
        await updateTokens()
      }
      if (i % 20 === 0) {
        await updateFarcasterAccounts()
        await updateTwitterAccounts()
        await updateVaults()
      }
    } catch (error) {
      console.error('[error]', error)
    }

    console.log('[sleep] waiting 30 seconds...')
    await new Promise((resolve) => setTimeout(resolve, 30000))
    i++
  }
}

main()
  .catch(console.error)
  .then(() => {
    process.exit(0)
  })
