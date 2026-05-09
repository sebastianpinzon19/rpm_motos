const { Pool } = require('pg')

async function main() {
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '123456789',
    database: 'rmp_motos'
  })

  const updates = [
    {
      id: 'def-001',
      images: ['https://source.unsplash.com/1200x800/?motorcycle,crashbar,honda'],
      imagesByModel: {
        'CB125F': 'https://source.unsplash.com/1200x800/?honda,CB125F,motorcycle',
        'FZ 150': 'https://source.unsplash.com/1200x800/?yamaha,FZ150,motorcycle',
        'GN 125': 'https://source.unsplash.com/1200x800/?suzuki,GN125,motorcycle',
        'Wave 110': 'https://source.unsplash.com/1200x800/?honda,Wave110,motorcycle',
        'Rider 125 FI': 'https://source.unsplash.com/1200x800/?motorcycle,125cc'
      }
    },
    {
      id: 'def-002',
      images: ['https://source.unsplash.com/1200x800/?motorcycle,streetfighter,crashbar'],
      imagesByModel: {
        'Pulsar NS200': 'https://source.unsplash.com/1200x800/?bajaj,Pulsar,NS200',
        'Pulsar 150': 'https://source.unsplash.com/1200x800/?bajaj,Pulsar150,motorcycle',
        'FZ 150': 'https://source.unsplash.com/1200x800/?yamaha,FZ150,motorcycle',
        'TT 150': 'https://source.unsplash.com/1200x800/?motorcycle,dual,sport'
      }
    },
    {
      id: 'acc-001',
      images: ['https://source.unsplash.com/1200x800/?motorcycle,rear,license,plate'],
      imagesByModel: {}
    },
    {
      id: 'acc-002',
      images: ['https://source.unsplash.com/1200x800/?motorcycle,luggage,rack,rear'],
      imagesByModel: {}
    }
  ]

  try {
    for (const item of updates) {
      await pool.query(
        'UPDATE products SET images = $1::jsonb, images_by_model = $2::jsonb WHERE id = $3',
        [JSON.stringify(item.images), JSON.stringify(item.imagesByModel), item.id]
      )
    }
    console.log('Product images updated successfully')
  } finally {
    await pool.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
