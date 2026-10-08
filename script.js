// ====================
// CONFIGURACIÓN Y REFERENCIAS
// ====================
const API_KEY = '17496c141ddc5613c9202c907f318273';
const API_URL = 'https://api.openweathermap.org/data/2.5/weather';
const API_FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast';

const formulario = document.getElementById('formulario');
const inputCiudad = document.getElementById('inputCiudad');
const resultado = document.getElementById('resultado');
const pronosticoContainer = document.getElementById('pronostico');
const estado = document.getElementById('estado');
const btnUbicacion = document.getElementById('btnUbicacion');
const btnTema = document.getElementById('btnTema');
const historialContainer = document.getElementById('historial');

// ====================
// FUNCIÓN PRINCIPAL
// ====================
async function consultarClima(query) {
  estado.textContent = '⏳ Consultando el clima...';
  resultado.classList.remove('visible');
  pronosticoContainer.innerHTML = '';

  try {
    const url = typeof query === 'string' 
      ? `${API_URL}?q=${encodeURIComponent(query)}&appid=${API_KEY}&units=metric&lang=es`
      : `${API_URL}?lat=${query.lat}&lon=${query.lon}&appid=${API_KEY}&units=metric&lang=es`;

    const respuesta = await fetch(url);
    if (!respuesta.ok) throw new Error(respuesta.status === 404 ? 'Ciudad no encontrada' : 'Error al consultar API');

    const datos = await respuesta.json();
    mostrarClima(datos);
    
    // RETO 3: Guardar en Historial si es búsqueda por texto
    if (typeof query === 'string') guardarHistorial(datos.name);

    // RETO 2: Consultar Pronóstico de 5 días
    consultarPronostico(datos.coord.lat, datos.coord.lon);

    estado.textContent = '✅ Datos actualizados correctamente.';
  } catch (error) {
    console.error('Error:', error);
    estado.textContent = `❌ ${error.message}.`;
  }
}

// ====================
// MOSTRAR CLIMA ACTUAL + RETO 5 (WhatsApp)
// ====================
function mostrarClima(datos) {
  const ciudad = datos.name;
  const pais = datos.sys.country;
  const temperatura = Math.round(datos.main.temp);
  const sensacion = Math.round(datos.main.feels_like);
  const humedad = datos.main.humidity;
  const presion = datos.main.pressure;
  const viento = datos.wind.speed;
  const descripcion = datos.weather[0].description;
  const iconoUrl = `https://openweathermap.org/img/wn/${datos.weather[0].icon}@2x.png`;

  // RETO 5: URL WhatsApp
  const mensajeWA = encodeURIComponent(`El clima en ${ciudad} es de ${temperatura}°C con ${descripcion}.`);
  const urlWhatsApp = `https://wa.me/?text=${mensajeWA}`;

  resultado.innerHTML = `
    <div class="ciudad">${ciudad}</div>
    <div class="pais">${pais}</div>
    <img src="${iconoUrl}" alt="${descripcion}" class="icono-clima">
    <div class="temperatura">${temperatura} °C</div>
    <div class="descripcion">${descripcion}</div>
    <div class="detalles">
      <div class="detalle"><div class="etiqueta">Sensación</div><div class="valor">${sensacion}°C</div></div>
      <div class="detalle"><div class="etiqueta">Humedad</div><div class="valor">${humedad}%</div></div>
      <div class="detalle"><div class="etiqueta">Presión</div><div class="valor">${presion} hPa</div></div>
      <div class="detalle"><div class="etiqueta">Viento</div><div class="valor">${viento} m/s</div></div>
    </div>
    <!-- RETO 5 -->
    <a href="${urlWhatsApp}" target="_blank" class="btn-whatsapp">📲 Compartir en WhatsApp</a>
  `;

  resultado.classList.add('visible');
  cambiarFondoSegunClima(datos.weather[0].main);
}

// ====================
// RETO 2: PRONÓSTICO 5 DÍAS
// ====================
async function consultarPronostico(lat, lon) {
  try {
    const url = `${API_FORECAST_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=es`;
    const res = await fetch(url);
    const datos = await res.json();

    // Filtramos para obtener la lectura del mediodía (12:00:00) de cada día
    const pronosticoDiario = datos.list.filter(item => item.dt_txt.includes('12:00:00'));

    pronosticoContainer.innerHTML = pronosticoDiario.map(dia => {
      const fecha = new Date(dia.dt * 1000).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
      return `
        <div class="pronostico-card">
          <p><strong>${fecha}</strong></p>
          <img src="https://openweathermap.org/img/wn/${dia.weather[0].icon}.png" alt="${dia.weather[0].description}">
          <p>${Math.round(dia.main.temp)}°C</p>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Error pronóstico:', err);
  }
}

// ====================
// RETO 1: GEOLOCALIZACIÓN
// ====================
btnUbicacion.addEventListener('click', () => {
  if (navigator.geolocation) {
    estado.textContent = '📍 Obteniendo tu ubicación...';
    navigator.geolocation.getCurrentPosition(
      (pos) => consultarClima({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => { estado.textContent = '❌ No se pudo obtener la ubicación.'; }
    );
  } else {
    estado.textContent = '❌ La geolocalización no es compatible con este navegador.';
  }
});

// ====================
// RETO 3: HISTORIAL (localStorage)
// ====================
function guardarHistorial(ciudad) {
  let historial = JSON.parse(localStorage.getItem('historial')) || [];
  if (!historial.includes(ciudad)) {
    historial.unshift(ciudad);
    if (historial.length > 5) historial.pop(); // Mantener máx 5
    localStorage.setItem('historial', JSON.stringify(historial));
  }
  renderHistorial();
}

function renderHistorial() {
  const historial = JSON.parse(localStorage.getItem('historial')) || [];
  historialContainer.innerHTML = historial.map(c => `
    <button type="button" class="btn-historial" onclick="consultarClima('${c}')">${c}</button>
  `).join('');
}

// ====================
// RETO 4: MODO CLARO/OSCURO
// ====================
btnTema.addEventListener('click', () => {
  document.body.classList.toggle('modo-claro');
});

// ====================
// EVENTOS E INICIALIZACIÓN
// ====================
function cambiarFondoSegunClima(clima) {
  document.body.classList.remove('clima-soleado', 'clima-nublado', 'clima-lluvioso', 'clima-nieve');
  const climaLower = clima.toLowerCase();
  if (climaLower.includes('clear')) document.body.classList.add('clima-soleado');
  else if (climaLower.includes('cloud')) document.body.classList.add('clima-nublado');
  else if (climaLower.includes('rain') || climaLower.includes('drizzle') || climaLower.includes('thunderstorm')) document.body.classList.add('clima-lluvioso');
  else if (climaLower.includes('snow')) document.body.classList.add('clima-nieve');
}

formulario.addEventListener('submit', (e) => {
  e.preventDefault();
  const ciudad = inputCiudad.value.trim();
  if (ciudad) consultarClima(ciudad);
});

// Inicializar historial
renderHistorial();
estado.textContent = 'Escribe una ciudad o usa tu ubicación actual.';