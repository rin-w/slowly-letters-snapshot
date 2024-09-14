/* * * * * * * * * * * *  / - - - - - - - - - - - - - - - - - - - - - - - - -
 * 
 * get token by running in browser console:
 * 
 * JSON.parse(JSON.parse(localStorage['persist:slowly']).me).token
 * 
 * * * * * * * * * / - - - - - - - - - - - - - - - - - - - - - - - - - - - - -


              */

const args = Array.from(process.argv)
args[0] = null
const token = args[args.findIndex(x => x === '-t') + 1]
const root_dest = './my_snapshots'
const apiBaseUrl = 'https://api.getslowly.com'
const nowISO = (new Date()).toISOString()
const nowLocal = new Intl.DateTimeFormat('ja', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date())
const snapshot_dir = `${root_dest}/${nowLocal.replace(/[:\/]/g, '').replace(/\s/g, '-')}_-_${nowISO.replace(/:/g,'--')}/`
const fetched_data = []
const friendAPI_url = new URLSearchParams()
const friendsListAPI_url = new URLSearchParams()
friendAPI_url.set('ver', '70200')
friendAPI_url.set('token', token)
friendAPI_url.set('page', 1)
friendsListAPI_url.set('requests', 1)
friendsListAPI_url.set('dob', true)
friendsListAPI_url.set('token', token)

console.warn("Snapshot: ", nowLocal)

main()

async function main() {
  try {
    await createSnapshotsFolder()
    if (!token) throw 'Token undefined\n\n\tnode index.js -t <token>'

    const self_data = await fetchSelf()

    await writeToFile({
      dest_dir: snapshot_dir,
      filename: 'self.json',
      data: JSON.stringify(self_data || {}, null, '\t') + "\n"
    })

    const friend_list = await fetchFriendList(friendsListAPI_url.toString())
    
    if ((friend_list?.friends || []) < 1) {
      throw "No friends found or network error."
    }

    await writeToFile({
      dest_dir: snapshot_dir,
      filename: 'friends.json',
      data: JSON.stringify(friend_list.friends || [], null, '\t') + "\n"
    })

    await fetchFriendData(friendAPI_url.toString(), friend_list.friends, fetched_data)
    await writeFriendData(fetched_data)

    console.log('End')
  }
  catch (e) { console.error(e) }
}

async function writeFriendData(data) {
  if (data.length < 1) throw "Network error."
  for (const friendData of data) {
    await parseFriendData(friendData)
  }
}

async function fetchFriendData(url, friend_list, data) {
  for (const friend of friend_list) {
    console.warn("Fetching: ", friend.id, friend.name, friend.emoji_status)
    data.push(await fetchFriend(friend.id, url))
  }
}

async function fetchFriendList(params) {
  const res = await fetch(`${apiBaseUrl}/users/me/friends/v2?${params}`)
  return await res.json() || {}
}

async function fetchFriend(friendPath, params) {
  const res = await fetch(`${apiBaseUrl}/friend/${friendPath}/all?${params}`)
  return await res.json() || {}
}

async function fetchSelf(friendPath, params) {
  const res = await fetch(`${apiBaseUrl}/web/me`, {
    "headers": {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token
    },
    "body": JSON.stringify({
      includes: "add_by_id,weather,paragraph"
    }),
    "method": "POST"
  })
  return await res.json() || {}
}

async function frenchFries() {
  console.log('🍟')
}

async function parseFriendData(friendData) {
  const { user } = friendData || {}
  const friend_name = user.name || '[unk-name]'
  const friend_id = user.id || '[unk-id]'
  await writeToFile({
    dest_dir: snapshot_dir,
    filename: `${friend_id}_${friend_name}.json`,
    data: JSON.stringify(friendData || {}, null, '\t') + "\n"
  })
}

async function createSnapshotsFolder(destination) {
  const fs = require('fs')
  const dest_dir = destination ?? root_dest
  if (!fs.existsSync(dest_dir)) {
    await fs.mkdir(dest_dir, { recursive: true }, (err) => {
      if (err) {
        console.error(err)
        throw "Write error."
      }
    })
  }
}

async function writeToFile({dest_dir, filename, data}) {
  const fs = require('fs')
  if (!fs.existsSync(dest_dir)) {
    fs.mkdir(dest_dir, { recursive: true }, (err) => {
      if (err) {
        console.error(err)
        throw "Write error."
      }
    })
    await writeToFile({dest_dir, filename, data})
  } else {
    await fs.promises.writeFile(dest_dir + filename, data);
  }
}
