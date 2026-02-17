// ==========================================
// COMPONENTE: MODAL DE PROPIEDAD
// ==========================================
function PropertyModal({ property, onClose }) {
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

  React.useEffect(() => {
    // Bloquear scroll del body cuando el modal está abierto
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  React.useEffect(() => {
    // Inicializar iconos cuando el modal se abre
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, []);

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === property.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? property.images.length - 1 : prev - 1
    );
  };

  const hasMultipleImages = property.images && property.images.length > 1;

  return React.createElement('div', {
    className: 'modal-overlay',
    onClick: onClose
  },
    React.createElement('div', {
      className: 'modal',
      onClick: (e) => e.stopPropagation()
    },
      // Botón cerrar
      React.createElement('button', {
        className: 'modal-close',
        onClick: onClose
      }, '✕'),

      // Galería grande
      React.createElement('div', { className: 'modal-gallery' },
        React.createElement('img', {
          src: property.images && property.images.length > 0 
            ? property.images[currentImageIndex] 
            : 'https://via.placeholder.com/800x600/2c5f7c/ffffff?text=Sin+Imagen',
          alt: property.title
        }),

        hasMultipleImages && React.createElement(React.Fragment, null,
          React.createElement('button', {
            className: 'gallery-nav prev',
            onClick: prevImage
          }, '←'),
          React.createElement('button', {
            className: 'gallery-nav next',
            onClick: nextImage
          }, '→'),
          React.createElement('div', { className: 'gallery-indicator' },
            `${currentImageIndex + 1} / ${property.images.length}`
          )
        ),

        property.badge && React.createElement('div', {
          className: `property-badge ${property.badge.toLowerCase().replace(' ', '-')}`,
          style: { position: 'absolute', top: '1rem', left: '1rem', zIndex: 10 }
        }, property.badge),

        React.createElement('div', {
          className: 'property-status',
          style: { position: 'absolute', top: '1rem', right: '1rem', zIndex: 10 }
        }, property.status === 'venta' ? 'EN VENTA' : 'EN ALQUILER')
      ),

      // Contenido del modal
      React.createElement('div', { className: 'modal-content' },
        React.createElement('div', { className: 'modal-header' },
          React.createElement('div', null,
            React.createElement('div', { className: 'modal-price' },
              formatPrice(property.price),
              property.status === 'alquiler' && React.createElement('span', { 
                style: { fontSize: '1rem', fontWeight: 400, color: '#666' }
              }, '/mes')
            ),
            React.createElement('h2', { className: 'modal-title' }, property.title),
            React.createElement('div', { className: 'modal-location' },
              React.createElement('i', { 'data-lucide': 'map-pin', width: 20, height: 20 }),
              React.createElement('span', null, property.location)
            )
          )
        ),

        // Características destacadas
        React.createElement('div', { className: 'modal-features' },
          property.area > 0 && React.createElement('div', { className: 'modal-feature' },
            React.createElement('i', { 'data-lucide': 'maximize', width: 24, height: 24 }),
            React.createElement('div', { className: 'modal-feature-value' }, property.area, 'm²'),
            React.createElement('div', { className: 'modal-feature-label' }, 'Área')
          ),
          property.bedrooms > 0 && React.createElement('div', { className: 'modal-feature' },
            React.createElement('i', { 'data-lucide': 'bed', width: 24, height: 24 }),
            React.createElement('div', { className: 'modal-feature-value' }, property.bedrooms),
            React.createElement('div', { className: 'modal-feature-label' }, 'Habitaciones')
          ),
          property.bathrooms > 0 && React.createElement('div', { className: 'modal-feature' },
            React.createElement('i', { 'data-lucide': 'bath', width: 24, height: 24 }),
            React.createElement('div', { className: 'modal-feature-value' }, property.bathrooms),
            React.createElement('div', { className: 'modal-feature-label' }, 'Baños')
          ),
          React.createElement('div', { className: 'modal-feature' },
            React.createElement('i', { 'data-lucide': 'home', width: 24, height: 24 }),
            React.createElement('div', { className: 'modal-feature-value' }, 
              property.type.charAt(0).toUpperCase() + property.type.slice(1)
            ),
            React.createElement('div', { className: 'modal-feature-label' }, 'Tipo')
          )
        ),

        // Descripción
        property.description && React.createElement('div', { className: 'modal-description' },
          React.createElement('h3', null, '📝 Descripción'),
          React.createElement('p', null, property.description)
        ),

        // Botones de acción
        React.createElement('div', { className: 'modal-cta' },
          React.createElement('a', {
            href: getWhatsAppLink(property),
            target: '_blank',
            rel: 'noopener noreferrer',
            className: 'btn btn-primary btn-large btn-whatsapp'
          },
            React.createElement('i', { 'data-lucide': 'message-circle', width: 24, height: 24 }),
            'Contactar por WhatsApp'
          ),
          React.createElement('button', {
            className: 'btn btn-secondary btn-large',
            onClick: () => {
              if (navigator.share) {
                navigator.share({
                  title: property.title,
                  text: `${property.title} - ${formatPrice(property.price)}`,
                  url: window.location.href
                });
              } else {
                alert('Compartir no disponible en este navegador');
              }
            }
          },
            React.createElement('i', { 'data-lucide': 'share-2', width: 24, height: 24 }),
            'Compartir'
          )
        )
      )
    )
  );
}

// ==========================================
// CONFIGURACIÓN
// ==========================================
const CONFIG = {
  // La API Key ahora está protegida en el backend
  API_ENDPOINT: '/api/properties',
  WHATSAPP: '+58 414 078 6961',
  AUTO_REFRESH_MINUTES: 5,
  CACHE_DURATION_MINUTES: 5
};

// ==========================================
// SERVICIO DE GOOGLE DRIVE
// ==========================================
class GoogleDriveService {
  constructor(apiKey, folderId) {
    this.apiKey = apiKey;
    this.folderId = folderId;
    this.cache = null;
    this.cacheTimestamp = null;
    this.cacheDuration = CONFIG.CACHE_DURATION_MINUTES * 60 * 1000;
  }

  hasValidCache() {
    if (!this.cache || !this.cacheTimestamp) return false;
    return (Date.now() - this.cacheTimestamp) < this.cacheDuration;
  }

  async getProperties(forceRefresh = false) {
    if (!forceRefresh && this.hasValidCache()) {
      console.log('📦 Usando datos en caché');
      return this.cache;
    }

    try {
      console.log('🔄 Cargando propiedades desde Google Drive...');
      
      const foldersUrl = `https://www.googleapis.com/drive/v3/files?q='${this.folderId}'+in+parents+and+mimeType='application/vnd.google-apps.folder'&key=${this.apiKey}`;
      const foldersResponse = await fetch(foldersUrl);
      
      if (!foldersResponse.ok) {
        throw new Error(`Error ${foldersResponse.status}: ${foldersResponse.statusText}`);
      }
      
      const foldersData = await foldersResponse.json();
      
      if (!foldersData.files || foldersData.files.length === 0) {
        console.warn('⚠️ No se encontraron carpetas de propiedades');
        return [];
      }

      console.log(`📁 Encontradas ${foldersData.files.length} carpetas`);

      const properties = await Promise.all(
        foldersData.files.map(folder => this.parsePropertyFolder(folder))
      );

      const validProperties = properties.filter(p => p && p.title);
      
      this.cache = validProperties;
      this.cacheTimestamp = Date.now();
      
      console.log(`✅ ${validProperties.length} propiedades cargadas exitosamente`);
      
      return validProperties;
      
    } catch (error) {
      console.error('❌ Error cargando desde Google Drive:', error);
      throw error;
    }
  }

  async parsePropertyFolder(folder) {
    try {
      const filesUrl = `https://www.googleapis.com/drive/v3/files?q='${folder.id}'+in+parents&key=${this.apiKey}&fields=files(id,name,mimeType)`;
      const filesResponse = await fetch(filesUrl);
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
          // Verificar si es Google Doc o archivo de texto normal
          let textUrl;
          if (infoFile.mimeType === 'application/vnd.google-apps.document') {
            // Es un Google Doc - usar export
            textUrl = `https://www.googleapis.com/drive/v3/files/${infoFile.id}/export?mimeType=text/plain&key=${this.apiKey}`;
          } else {
            // Es un archivo de texto normal
            textUrl = `https://www.googleapis.com/drive/v3/files/${infoFile.id}?alt=media&key=${this.apiKey}`;
          }
          
          const textResponse = await fetch(textUrl);
          
          if (!textResponse.ok) {
            throw new Error(`Error ${textResponse.status}: No se pudo leer info.txt`);
          }
          
          const textContent = await textResponse.text();
          propertyData = this.parseInfoFile(textContent, propertyData);
        } catch (error) {
          console.warn(`⚠️ Error leyendo info.txt de ${folder.name}:`, error);
        }
      }

      propertyData.images = imageFiles.map(img => {
        const url = `https://lh3.googleusercontent.com/d/${img.id}`;
        console.log(`📸 Imagen encontrada: ${img.name} → ${url}`);
        return url;
      });

      if (propertyData.images.length === 0) {
        console.warn(`⚠️ No se encontraron imágenes en ${folder.name}`);
      } else {
        console.log(`✅ ${propertyData.images.length} imagen(es) cargada(s) para ${folder.name}`);
      }

      return propertyData;
      
    } catch (error) {
      console.error(`Error procesando carpeta ${folder.name}:`, error);
      return null;
    }
  }

  parseInfoFile(content, baseData) {
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

  clearCache() {
    this.cache = null;
    this.cacheTimestamp = null;
  }
}

// ==========================================
// SERVICIO SIMPLIFICADO (USA BACKEND)
// ==========================================
class PropertyService {
  constructor(apiEndpoint) {
    this.apiEndpoint = apiEndpoint;
    this.cache = null;
    this.cacheTimestamp = null;
    this.cacheDuration = CONFIG.CACHE_DURATION_MINUTES * 60 * 1000;
  }

  hasValidCache() {
    if (!this.cache || !this.cacheTimestamp) return false;
    return (Date.now() - this.cacheTimestamp) < this.cacheDuration;
  }

  async getProperties(forceRefresh = false) {
    if (!forceRefresh && this.hasValidCache()) {
      console.log('📦 Usando datos en caché');
      return this.cache;
    }

    try {
      console.log('🔄 Cargando propiedades desde el servidor...');
      
      const response = await fetch(this.apiEndpoint);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const properties = await response.json();
      
      if (!Array.isArray(properties)) {
        throw new Error('Formato de datos inválido');
      }
      
      this.cache = properties;
      this.cacheTimestamp = Date.now();
      
      console.log(`✅ ${properties.length} propiedades cargadas exitosamente`);
      
      return properties;
      
    } catch (error) {
      console.error('❌ Error cargando propiedades:', error);
      throw error;
    }
  }

  clearCache() {
    this.cache = null;
    this.cacheTimestamp = null;
  }
}

// ==========================================
// FUNCIONES HELPER
// ==========================================
const formatPrice = (price) => {
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(price);
};

const getWhatsAppLink = (property) => {
  // Crear referencia corta y legible
  const ref = property.folderName || property.id.substring(0, 8);
  
  let message = `Hola! Me interesa esta propiedad:\n\n`;
  message += `🏠 *${property.title}*\n`;
  message += `📍 ${property.location}\n`;
  message += `💰 ${formatPrice(property.price)}`;
  
  if (property.status === 'alquiler') {
    message += '/mes';
  }
  
  message += `\n\n`;
  
  if (property.area > 0 || property.bedrooms > 0 || property.bathrooms > 0) {
    message += 'Características:\n';
    if (property.area > 0) message += `📐 ${property.area}m²\n`;
    if (property.bedrooms > 0) message += `🛏️ ${property.bedrooms} habitaciones\n`;
    if (property.bathrooms > 0) message += `🚿 ${property.bathrooms} baños\n`;
    message += `\n`;
  }
  
  message += `¿Podrían darme más información?\n\n`;
  message += `_Ref: ${ref}_`;
  
  const phone = CONFIG.WHATSAPP.replace(/\s+/g, '').replace('+', '');
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
};

// ==========================================
// COMPONENTE: TARJETA DE PROPIEDAD CON GALERÍA
// ==========================================
function PropertyCard({ property, onClick }) {
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => 
      prev === property.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => 
      prev === 0 ? property.images.length - 1 : prev - 1
    );
  };

  const hasMultipleImages = property.images && property.images.length > 1;

  return React.createElement('div', {
    className: `property-card ${property.badge === 'VENDIDO' ? 'sold' : ''}`,
    onClick: () => onClick(property),
    style: { cursor: 'pointer' }
  },
    // Imagen con galería
    React.createElement('div', { className: 'property-image' },
      React.createElement('img', { 
        src: property.images && property.images.length > 0 
          ? property.images[currentImageIndex] 
          : 'https://via.placeholder.com/400x240/2c5f7c/ffffff?text=Sin+Imagen', 
        alt: property.title,
        loading: 'lazy',
        onError: (e) => {
          console.error('❌ Error cargando imagen');
          e.target.src = 'https://via.placeholder.com/400x240/2c5f7c/ffffff?text=Imagen+No+Disponible';
        }
      }),
      
      // Controles de navegación
      hasMultipleImages && React.createElement('div', { 
        style: { 
          position: 'absolute',
          top: '50%',
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          padding: '0 1rem',
          transform: 'translateY(-50%)',
          zIndex: 8
        }
      },
        React.createElement('button', {
          onClick: prevImage,
          style: {
            background: 'rgba(0,0,0,0.6)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            cursor: 'pointer',
            fontSize: '1.2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(4px)'
          }
        }, '←'),
        React.createElement('button', {
          onClick: nextImage,
          style: {
            background: 'rgba(0,0,0,0.6)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            cursor: 'pointer',
            fontSize: '1.2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(4px)'
          }
        }, '→')
      ),
      
      // Contador de imágenes
      hasMultipleImages && React.createElement('div', {
        style: {
          position: 'absolute',
          bottom: '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.6)',
          color: 'white',
          padding: '0.3rem 0.8rem',
          borderRadius: '12px',
          fontSize: '0.85rem',
          zIndex: 8,
          backdropFilter: 'blur(4px)'
        }
      }, `${currentImageIndex + 1} / ${property.images.length}`),
      
      // Badges
      property.badge && React.createElement('div', {
        className: `property-badge ${property.badge.toLowerCase().replace(' ', '-')}`
      }, property.badge),
      
      React.createElement('div', { className: 'property-status' },
        property.status === 'venta' ? 'EN VENTA' : 'EN ALQUILER'
      )
    ),
    
    // Contenido
    React.createElement('div', { className: 'property-content' },
      React.createElement('div', { className: 'property-price' },
        formatPrice(property.price),
        property.status === 'alquiler' && React.createElement('span', { className: 'price-period' }, '/mes')
      ),
      React.createElement('h3', { className: 'property-title' }, property.title),
      React.createElement('div', { className: 'property-location' },
        React.createElement('i', { 'data-lucide': 'map-pin', width: 16, height: 16 }),
        React.createElement('span', null, property.location)
      ),
      React.createElement('div', { className: 'property-features' },
        property.area > 0 && React.createElement('div', { className: 'feature' },
          React.createElement('i', { 'data-lucide': 'maximize', width: 18, height: 18 }),
          React.createElement('span', null, property.area, 'm²')
        ),
        property.bedrooms > 0 && React.createElement('div', { className: 'feature' },
          React.createElement('i', { 'data-lucide': 'bed', width: 18, height: 18 }),
          React.createElement('span', null, property.bedrooms)
        ),
        property.bathrooms > 0 && React.createElement('div', { className: 'feature' },
          React.createElement('i', { 'data-lucide': 'bath', width: 18, height: 18 }),
          React.createElement('span', null, property.bathrooms)
        )
      ),
      React.createElement('div', { className: 'property-type' }, property.type),
      React.createElement('a', {
        href: getWhatsAppLink(property),
        target: '_blank',
        rel: 'noopener noreferrer',
        className: 'btn btn-primary',
        style: { marginTop: '1rem', width: '100%', justifyContent: 'center' },
        onClick: (e) => e.stopPropagation()
      },
        React.createElement('i', { 'data-lucide': 'message-circle', width: 18, height: 18 }),
        'Contactar'
      )
    )
  );
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
const { useState, useEffect } = React;

function App() {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [selectedProperty, setSelectedProperty] = useState(null);
  
  const [driveService] = useState(() => 
    new PropertyService(CONFIG.API_ENDPOINT)
  );

  const [filters, setFilters] = useState({
    priceMin: '',
    priceMax: '',
    type: [],
    status: [],
    bedrooms: '',
    bathrooms: '',
    location: ''
  });

  const loadProperties = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const loadedProperties = await driveService.getProperties(forceRefresh);
      
      setProperties(loadedProperties);
      setFilteredProperties(loadedProperties);
      setLastUpdate(new Date());
      
    } catch (err) {
      console.error('Error cargando propiedades:', err);
      setError(err.message || 'Error al cargar las propiedades');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    driveService.clearCache();
    await loadProperties(true);
  };

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refresh activado');
      loadProperties(false);
    }, CONFIG.AUTO_REFRESH_MINUTES * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, [loading, filteredProperties, showFilters, viewMode]);

  useEffect(() => {
    let result = properties.filter(prop => {
      const matchSearch = searchTerm === '' || 
        prop.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prop.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prop.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchPriceMin = filters.priceMin === '' || prop.price >= parseFloat(filters.priceMin);
      const matchPriceMax = filters.priceMax === '' || prop.price <= parseFloat(filters.priceMax);
      const matchType = filters.type.length === 0 || filters.type.includes(prop.type);
      const matchStatus = filters.status.length === 0 || filters.status.includes(prop.status);
      const matchBedrooms = filters.bedrooms === '' || prop.bedrooms >= parseInt(filters.bedrooms);
      const matchBathrooms = filters.bathrooms === '' || prop.bathrooms >= parseInt(filters.bathrooms);
      const matchLocation = filters.location === '' || 
        prop.location.toLowerCase().includes(filters.location.toLowerCase());

      return matchSearch && matchPriceMin && matchPriceMax && matchType && 
             matchStatus && matchBedrooms && matchBathrooms && matchLocation;
    });

    result.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return b.price - a.price;
    });

    setFilteredProperties(result);
  }, [searchTerm, filters, properties]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleCheckboxFilter = (key, value) => {
    setFilters(prev => {
      const currentValues = prev[key];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      
      return {
        ...prev,
        [key]: newValues
      };
    });
  };

  const clearFilters = () => {
    setFilters({
      priceMin: '',
      priceMax: '',
      type: [],
      status: [],
      bedrooms: '',
      bathrooms: '',
      location: ''
    });
    setSearchTerm('');
  };

  const hasActiveFilters = 
    searchTerm !== '' ||
    filters.priceMin !== '' ||
    filters.priceMax !== '' ||
    filters.type.length > 0 ||
    filters.status.length > 0 ||
    filters.bedrooms !== '' ||
    filters.bathrooms !== '' ||
    filters.location !== '';

  return React.createElement('div', { className: 'app' },
    React.createElement('header', { className: 'header' },
      React.createElement('div', { className: 'header-content' },
        React.createElement('div', { className: 'logo' },
          React.createElement('i', { 'data-lucide': 'home', width: 32, height: 32 }),
          'Premium Inmobiliaria'
        ),
        React.createElement('div', { className: 'header-actions' },
          React.createElement('button', {
            className: `btn btn-refresh ${refreshing ? 'refreshing' : ''}`,
            onClick: handleRefresh,
            disabled: refreshing
          },
            React.createElement('i', { 'data-lucide': 'refresh-cw', width: 18, height: 18 }),
            !refreshing && 'Actualizar'
          ),
          React.createElement('a', {
            href: `https://wa.me/${CONFIG.WHATSAPP.replace(/\s+/g, '').replace('+', '')}`,
            className: 'btn btn-primary',
            target: '_blank',
            rel: 'noopener noreferrer'
          },
            React.createElement('i', { 'data-lucide': 'phone', width: 20, height: 20 }),
            React.createElement('span', null, 'Contactar')
          )
        )
      )
    ),
    
    React.createElement('section', { className: 'hero' },
      React.createElement('div', { className: 'hero-content' },
        React.createElement('h1', null, 'Encuentra Tu Propiedad Ideal'),
        React.createElement('p', null, 'Las mejores oportunidades inmobiliarias en las zonas más exclusivas')
      )
    ),
    
    error && React.createElement('div', { className: 'error-message' },
      React.createElement('strong', null, '⚠️ Error:'),
      ' ', error
    ),
    
    React.createElement('div', { className: 'search-section' },
      React.createElement('div', { className: 'search-bar' },
        React.createElement('div', { className: 'search-input-wrapper' },
          React.createElement('i', { 'data-lucide': 'search', width: 20, height: 20, color: '#999' }),
          React.createElement('input', {
            type: 'text',
            placeholder: 'Buscar por ubicación, título o características...',
            value: searchTerm,
            onChange: (e) => setSearchTerm(e.target.value)
          })
        ),
        React.createElement('button', {
          className: `btn btn-secondary ${showFilters ? 'active' : ''}`,
          onClick: () => setShowFilters(!showFilters)
        },
          React.createElement('i', { 'data-lucide': 'filter', width: 20, height: 20 }),
          'Filtros'
        )
      ),
      
      showFilters && React.createElement('div', { className: 'filters-panel' },
        React.createElement('div', { className: 'filters-header' },
          React.createElement('h3', null, '🔍 Filtros Avanzados'),
          hasActiveFilters && React.createElement('button', {
            className: 'filter-reset',
            onClick: clearFilters
          }, '✕ Limpiar filtros')
        ),
        React.createElement('div', { className: 'filters-grid' },
          React.createElement('div', { className: 'filter-group' },
            React.createElement('label', null, 'Precio Mínimo (USD)'),
            React.createElement('input', {
              type: 'number',
              placeholder: '0',
              value: filters.priceMin,
              onChange: (e) => handleFilterChange('priceMin', e.target.value)
            })
          ),
          React.createElement('div', { className: 'filter-group' },
            React.createElement('label', null, 'Precio Máximo (USD)'),
            React.createElement('input', {
              type: 'number',
              placeholder: '1000000',
              value: filters.priceMax,
              onChange: (e) => handleFilterChange('priceMax', e.target.value)
            })
          ),
          React.createElement('div', { className: 'filter-group' },
            React.createElement('label', null, 'Habitaciones Mínimas'),
            React.createElement('select', {
              value: filters.bedrooms,
              onChange: (e) => handleFilterChange('bedrooms', e.target.value)
            },
              React.createElement('option', { value: '' }, 'Cualquiera'),
              React.createElement('option', { value: '1' }, '1+'),
              React.createElement('option', { value: '2' }, '2+'),
              React.createElement('option', { value: '3' }, '3+'),
              React.createElement('option', { value: '4' }, '4+')
            )
          ),
          React.createElement('div', { className: 'filter-group' },
            React.createElement('label', null, 'Baños Mínimos'),
            React.createElement('select', {
              value: filters.bathrooms,
              onChange: (e) => handleFilterChange('bathrooms', e.target.value)
            },
              React.createElement('option', { value: '' }, 'Cualquiera'),
              React.createElement('option', { value: '1' }, '1+'),
              React.createElement('option', { value: '2' }, '2+'),
              React.createElement('option', { value: '3' }, '3+')
            )
          ),
          React.createElement('div', { className: 'filter-group' },
            React.createElement('label', null, 'Ubicación'),
            React.createElement('input', {
              type: 'text',
              placeholder: 'Ej: Altamira, Caracas',
              value: filters.location,
              onChange: (e) => handleFilterChange('location', e.target.value)
            })
          ),
          React.createElement('div', { className: 'filter-group' },
            React.createElement('label', null, 'Tipo de Propiedad'),
            React.createElement('div', { className: 'checkbox-group' },
              ['apartamento', 'casa', 'local', 'terreno'].map(type =>
                React.createElement('label', { key: type, className: 'checkbox-label' },
                  React.createElement('input', {
                    type: 'checkbox',
                    checked: filters.type.includes(type),
                    onChange: () => handleCheckboxFilter('type', type)
                  }),
                  React.createElement('span', null, type.charAt(0).toUpperCase() + type.slice(1))
                )
              )
            )
          ),
          React.createElement('div', { className: 'filter-group' },
            React.createElement('label', null, 'Operación'),
            React.createElement('div', { className: 'checkbox-group' },
              ['venta', 'alquiler'].map(status =>
                React.createElement('label', { key: status, className: 'checkbox-label' },
                  React.createElement('input', {
                    type: 'checkbox',
                    checked: filters.status.includes(status),
                    onChange: () => handleCheckboxFilter('status', status)
                  }),
                  React.createElement('span', null, status.charAt(0).toUpperCase() + status.slice(1))
                )
              )
            )
          )
        )
      )
    ),
    
    !loading && React.createElement('div', { className: 'status-bar' },
      React.createElement('div', { className: 'last-update' },
        lastUpdate && `Última actualización: ${lastUpdate.toLocaleTimeString()}`
      ),
      React.createElement('div', { className: 'view-toggle' },
        React.createElement('button', {
          className: `btn-view ${viewMode === 'grid' ? 'active' : ''}`,
          onClick: () => setViewMode('grid')
        },
          React.createElement('i', { 'data-lucide': 'grid', width: 16, height: 16 }),
          'Grid'
        ),
        React.createElement('button', {
          className: `btn-view ${viewMode === 'list' ? 'active' : ''}`,
          onClick: () => setViewMode('list')
        },
          React.createElement('i', { 'data-lucide': 'list', width: 16, height: 16 }),
          'Lista'
        )
      )
    ),
    
    React.createElement('section', { className: 'properties-section' },
      loading ? React.createElement('div', { className: 'loading' },
        React.createElement('div', { className: 'spinner' }),
        React.createElement('p', null, 'Cargando propiedades...')
      ) : React.createElement('div', null,
        React.createElement('div', { className: 'properties-header' },
          React.createElement('div', { className: 'properties-count' },
            React.createElement('strong', null, filteredProperties.length),
            ' ', filteredProperties.length === 1 ? 'propiedad encontrada' : 'propiedades encontradas'
          )
        ),
        filteredProperties.length === 0 ? React.createElement('div', { className: 'no-results' },
          React.createElement('h3', null, '🔍 No se encontraron propiedades'),
          React.createElement('p', null, 'Intenta ajustar los filtros de búsqueda')
        ) : React.createElement('div', { 
          className: `properties-grid ${viewMode === 'list' ? 'list-view' : ''}`
        },
          filteredProperties.map(prop => 
            React.createElement(PropertyCard, { 
              key: prop.id, 
              property: prop,
              onClick: setSelectedProperty
            })
          )
        )
      )
    ),
    
    // Modal de propiedad
    selectedProperty && React.createElement(PropertyModal, {
      property: selectedProperty,
      onClose: () => setSelectedProperty(null)
    }),
    
    React.createElement('a', {
      href: `https://wa.me/${CONFIG.WHATSAPP.replace(/\s+/g, '').replace('+', '')}?text=Hola! Me interesa conocer más sobre sus propiedades`,
      target: '_blank',
      rel: 'noopener noreferrer',
      className: 'whatsapp-float'
    },
      React.createElement('i', { 'data-lucide': 'message-circle', width: 28, height: 28 })
    ),
    
    React.createElement('footer', { className: 'footer' },
      React.createElement('div', { className: 'footer-content' },
        React.createElement('div', { className: 'footer-section' },
          React.createElement('h4', null, 'Premium Inmobiliaria'),
          React.createElement('p', null, 'Tu socio de confianza en bienes raíces. Conectamos sueños con realidades.')
        ),
        React.createElement('div', { className: 'footer-section' },
          React.createElement('h4', null, 'Contacto'),
          React.createElement('p', null, `📱 ${CONFIG.WHATSAPP}`),
          React.createElement('p', null, '📧 info@premiuminmobiliaria.com')
        ),
        React.createElement('div', { className: 'footer-section' },
          React.createElement('h4', null, 'Horario'),
          React.createElement('p', null, 'Lunes a Viernes: 9:00 AM - 6:00 PM'),
          React.createElement('p', null, 'Sábados: 10:00 AM - 2:00 PM')
        )
      ),
      React.createElement('div', { className: 'footer-bottom' },
        React.createElement('p', null, `© ${new Date().getFullYear()} Premium Inmobiliaria. Todos los derechos reservados.`)
      )
    )
  );
}

// ==========================================
// INICIALIZAR APLICACIÓN
// ==========================================
const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);
root.render(React.createElement(App));
 
setTimeout(() => {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}, 100);