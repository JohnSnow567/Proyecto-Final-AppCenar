const db = require('../../models');

module.exports = {
  listarPedidos: async (req, res) => {
    try {
      const pedidos = await db.Pedido.findAll({
        where: { id_cliente: req.session.user.id },
        include: [
          { model: db.Comercio, as: 'comercio', attributes: ['id', 'nombre_comercio', 'logo'] },
          { model: db.Producto, attributes: ['id'], through: { attributes: [] } }
        ],
        order: [['fecha_hora', 'DESC']]
      });

      res.render('cliente/pedidos', {
        title: 'Mis Pedidos',
        pedidos: pedidos.map(p => ({
          ...p.get({ plain: true }),
          cantidadProductos: p.productos.length
        })),
        user: req.session.user
      });
    } catch (error) {
      console.error('Error al listar pedidos:', error);
      res.status(500).render('error', {
        message: 'Error al cargar los pedidos',
        title: 'Error'
      });
    }
  },

  detallePedido: async (req, res) => {
    try {
      const pedido = await db.Pedido.findOne({
        where: { id: req.params.id, id_cliente: req.session.user.id },
        include: [
          { model: db.Comercio, as: 'comercio', attributes: ['id', 'nombre_comercio', 'logo'] },
          { model: db.Producto, attributes: ['id', 'nombre', 'precio', 'imagen'] }
        ]
      });

      if (!pedido) {
        return res.status(404).render('error', {
          message: 'Pedido no encontrado',
          title: 'Error'
        });
      }

      res.render('cliente/detallePedido', {
        title: `Pedido #${pedido.id}`,
        pedido: pedido.get({ plain: true }),
        user: req.session.user
      });
    } catch (error) {
      console.error('Error al ver detalle pedido:', error);
      res.status(500).render('error', {
        message: 'Error al cargar el pedido',
        title: 'Error'
      });
    }
  }
};