// api/properties.js - Backend para proteger API Key

const API_KEY = process.env.GOOGLE_DRIVE_API_KEY;
const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

async function parsePropertyFolder(folder, apiKey) {
  try {
    const filesUrl = `https://www.googleapis.com/drive/v3/files?q='${folder.id}'+in+parents&key=${apiKey}&fields=files(id,name,mimeType)`;
    const filesResponse = await fetch(filesUrl);
    
    if (!filesResponse.ok) {
      throw new Error(`Error ${filesResponse.status}`);
    }
    
    const filesData = await filesResponse.json();

    if (!filesData.files) return null;

    const infoFile = filesData.files.find(f => 
      f.name.toLowerCase() === 'info.txt' || 
      f.name.toLowerCase() === 'datos.txt'
    );

    const imageFiles = filesData.files
      .filter(f => f.mimeType && f.mimeType.startsWith('image/'))
      .sort((a, b) => a.name.localeCompare(b.name));

    let propertyData = {
      id: folder.id,
      folderName: folder.name,
      title: folder.name.replace(/^\d+-/, '').replace(/-/g, ' '),
      description: '',
      price: 0,
      location: '',
      area: 0,
      bedrooms: 0,
      bathrooms: 0,
      type: 'apartamento',
      status: 'venta',
      badge: '',
      featured: false,
      asesor: '',
      telefono_asesor: '',
      images: []
    };

    if (infoFile) {
      try {
        let textUrl;
        if (infoFile.mimeType === 'application/vnd.google-apps.document') {
          textUrl = `https://www.googleapis.com/drive/v3/files/${infoFile.id}/export?mimeType=text/plain&key=${apiKey}`;
        } else {
          textUrl = `https://www.googleapis.com/drive/v3/files/${infoFile.id}?alt=media&key=${apiKey}`;
        }
        
        const textResponse = await fetch(textUrl);
        
        if (textResponse.ok) {
          const textContent = await textResponse.text();
          propertyData = parseInfoFile(textContent, propertyData);
        }
      } catch (error) {
        console.warn(`Error leyendo info.txt de ${folder.name}`);
      }
    }

    propertyData.images = imageFiles.map(img => 
      `https://lh3.googleusercontent.com/d/${img.id}`
    );

    return propertyData;
    
  } catch (error) {
    console.error(`Error procesando carpeta ${folder.name}:`, error);
    return null;
  }
}

function parseInfoFile(content, baseData) {
  const data = { ...baseData };
  const lines = content.split('\n');
  
  lines.forEach(line => {
    const trimmedLine = line.trim();
    if (!trimmedLine || !trimmedLine.includes('=')) return;
    
    const [key, ...valueParts] = trimmedLine.split('=');
    const value = valueParts.join('=').trim();
    const cleanKey = key.trim().toLowerCase();
    
    if (!value) return;
    
    switch(cleanKey) {
      case 'title':
      case 'titulo':
        data.title = value;
        break;
      case 'description':
      case 'descripcion':
        data.description = value;
        break; 
      case 'price':
      case 'precio':
        data.price = parseFloat(value.replace(/[^0-9.]/g, '')) || 0;
        break;
      case 'location':
      case 'ubicacion':
        data.location = value;
        break;
      case 'area':
      case 'metros':
      case 'm2':
        data.area = parseFloat(value.replace(/[^0-9.]/g, '')) || 0;
        break;
      case 'bedrooms':
      case 'habitaciones':
        data.bedrooms = parseInt(value) || 0;
        break;
      case 'bathrooms':
      case 'baños':
      case 'banos':
        data.bathrooms = parseInt(value) || 0;
        break;
      case 'type':
      case 'tipo':
        data.type = value.toLowerCase();
        break;
      case 'status':
      case 'estado':
        data.status = value.toLowerCase();
        break;
      case 'badge':
      case 'etiqueta':
        data.badge = value.toUpperCase();
        break;
      case 'featured':
      case 'destacado':
        data.featured = value.toLowerCase() === 'true' || value === '1';
        break;
      case 'asesor':
      case 'agente':
      case 'captador':
        data.asesor = value;
        break;
      case 'telefono_asesor':
      case 'telefono':
      case 'tel_asesor':
        data.telefono_asesor = value;
        break;
    }
  });
  
  return data;
}

export default async function handler(req, res) {
  // Habilitar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const foldersUrl = `https://www.googleapis.com/drive/v3/files?q='${FOLDER_ID}'+in+parents+and+mimeType='application/vnd.google-apps.folder'&key=${API_KEY}`;
    const foldersResponse = await fetch(foldersUrl);
    
    if (!foldersResponse.ok) {
      throw new Error(`Error ${foldersResponse.status}: ${foldersResponse.statusText}`);
    }
    
    const foldersData = await foldersResponse.json();
    
    if (!foldersData.files || foldersData.files.length === 0) {
      return res.status(200).json([]);
    }

    const properties = await Promise.all(
      foldersData.files.map(folder => parsePropertyFolder(folder, API_KEY))
    );

    const validProperties = properties.filter(p => p && p.title);
    
    res.status(200).json(validProperties);
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Error al cargar propiedades',
      message: error.message 
    });
  }
}