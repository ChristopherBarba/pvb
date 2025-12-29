const express = require('express')
const cors = require('cors');
require('dotenv').config();
const app = express()
const port = process.env.PORT || 4000

app.use(cors()); // Permite conexiones externas
app.use(express.json()); // Permite que tu API reciba datos en formato JSON

// Rutas
const { verificarToken, esAdmin } = require('./middlewares/authMiddleware');

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/ventas', verificarToken, require('./routes/ventasRoutes')); // Protegido (Admin y Cajero)
app.use('/api/compras', [verificarToken, esAdmin], require('./routes/comprasRoutes')); // Solo Admin
app.use('/api/caja', verificarToken, require('./routes/cajaRoutes'));

// app.get('/', (req, res) => {
//   res.send('Hello World!')
// })

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})