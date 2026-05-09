export const initialData = {
  brands: [
    {
      id: "honda",
      name: "Honda",
      logo: "/logos/honda.png",
      models: ["CB125F", "Wave 110", "CB190R", "XR 150L", "PCX 150"]
    },
    {
      id: "yamaha",
      name: "Yamaha",
      models: ["FZ 150", "YBR 125", "MT-03", "NMAX 155", "Crypton 110"]
    },
    {
      id: "suzuki",
      name: "Suzuki",
      models: ["GN 125", "Gixxer 150", "Raider R150", "V-Strom 650"]
    },
    {
      id: "bajaj",
      name: "Bajaj",
      models: ["Pulsar NS200", "Pulsar 150", "Rouser NS 125", "Dominar 400"]
    },
    {
      id: "rider",
      name: "Rider",
      models: ["Rider 125 FI", "Rider 150"]
    },
    {
      id: "akt",
      name: "AKT",
      models: ["TT 150", "Dynamic R 150", "AK 125", "NKD 125"]
    }
  ],

  categories: [
    { id: "defensas", name: "Defensas", active: true },
    { id: "accesorios", name: "Accesorios", active: true }
  ],

  products: [
    {
      id: "def-001",
      name: "Defensa Stung Premium",
      category: "defensas",
      compatibleBrands: ["honda", "yamaha", "suzuki", "rider"],
      compatibleModels: ["CB125F", "Wave 110", "FZ 150", "GN 125", "Rider 125 FI"],
      basePrice: 85000,
      stock: 12,
      active: true,
      images: ["https://source.unsplash.com/1200x800/?motorcycle,crashbar,honda"],
      imagesByModel: {
        "CB125F": "https://source.unsplash.com/1200x800/?honda,CB125F,motorcycle",
        "FZ 150": "https://source.unsplash.com/1200x800/?yamaha,FZ150,motorcycle"
      },
      description: "Defensa tubular de alta resistencia, acabado cromado, instalación directa sin modificar la moto.",
      customizable: true,
      options: {
        topes: [
          { id: "normal", name: "Topes Normales", priceModifier: 0 },
          { id: "granada", name: "Topes Tipo Granada", priceModifier: 8000 },
          { id: "doble", name: "Topes Doble Refuerzo", priceModifier: 12000 }
        ],
        marcado: [
          { id: "normal", name: "Normal", priceModifier: 0 },
          { id: "contramarcado", name: "Contramarcado", priceModifier: 5000 }
        ],
        colores: [
          { id: "negro", name: "Negro", hex: "#1a1a1a", priceModifier: 0 },
          { id: "rojo", name: "Rojo", hex: "#cc0000", priceModifier: 0 },
          { id: "rojo-negro", name: "Rojo con Negro", hex: "#8B0000", priceModifier: 3000 },
          { id: "azul-negro", name: "Azul con Manchas Negras", hex: "#1a3a6b", priceModifier: 3000 },
          { id: "cromado", name: "Cromado", hex: "#C0C0C0", priceModifier: 6000 },
          { id: "dorado", name: "Dorado", hex: "#DAA520", priceModifier: 6000 }
        ]
      }
    },
    {
      id: "def-002",
      name: "Defensa Stung Sport",
      category: "defensas",
      compatibleBrands: ["bajaj", "yamaha", "akt"],
      compatibleModels: ["Pulsar NS200", "Pulsar 150", "FZ 150", "TT 150"],
      basePrice: 95000,
      stock: 5,
      active: true,
      images: ["https://source.unsplash.com/1200x800/?motorcycle,streetfighter,crashbar"],
      imagesByModel: {
        "Pulsar NS200": "https://source.unsplash.com/1200x800/?bajaj,Pulsar,NS200"
      },
      description: "Defensa deportiva de perfil bajo, ideal para motos tipo naked y deportivas.",
      customizable: true,
      options: {
        topes: [
          { id: "normal", name: "Topes Normales", priceModifier: 0 },
          { id: "granada", name: "Topes Tipo Granada", priceModifier: 8000 }
        ],
        marcado: [
          { id: "normal", name: "Normal", priceModifier: 0 },
          { id: "contramarcado", name: "Contramarcado", priceModifier: 5000 }
        ],
        colores: [
          { id: "negro", name: "Negro", hex: "#1a1a1a", priceModifier: 0 },
          { id: "rojo", name: "Rojo", hex: "#cc0000", priceModifier: 0 },
          { id: "azul-negro", name: "Azul con Manchas Negras", hex: "#1a3a6b", priceModifier: 3000 }
        ]
      }
    },
    {
      id: "acc-001",
      name: "Portaplaca Universal",
      category: "accesorios",
      compatibleBrands: ["honda", "yamaha", "suzuki", "bajaj", "rider", "akt"],
      basePrice: 25000,
      stock: 30,
      active: true,
      images: ["https://source.unsplash.com/1200x800/?motorcycle,rear,license,plate"],
      description: "Portaplaca universal con luz LED integrada.",
      customizable: false
    },
    {
      id: "acc-002",
      name: "Parrilla Trasera",
      category: "accesorios",
      compatibleBrands: ["honda", "rider"],
      compatibleModels: ["CB125F", "Wave 110", "Rider 125 FI"],
      basePrice: 45000,
      stock: 8,
      active: true,
      images: ["https://source.unsplash.com/1200x800/?motorcycle,luggage,rack,rear"],
      description: "Parrilla metálica reforzada para carga posterior.",
      customizable: false
    }
  ],

  settings: {
    whatsappNumber: "573001234567",
    storeName: "RMP Motos",
    tagline: "Defensas Stung - Protección y Estilo para tu Moto"
  }
}
