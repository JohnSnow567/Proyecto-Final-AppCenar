const db = require('../../models');

module.exports = {
    homeDelivery: async (req, res) => {
        try {
            const pedidos = await db.Pedido.findAll({
                where: { id_delivery: req.session.user.id },
                include: [
                    { model: db.Comercio, as: 'comercio', attributes: ['id', 'nombre_comercio', 'logo'] },
                    { model: db.Usuario, as: 'cliente', attributes: ['id', 'nombre', 'apellido'] }
                ],
                order: [['fecha_hora', 'DESC']]
            });
            
            res.render('delivery/home', { 
                user: req.session.user,
                pedidos: pedidos,
                title: 'Home - Delivery'
            });
        } catch (error) {
            console.error('Error en homeDelivery:', error);
            res.status(500).render('error', { 
                message: 'Error al cargar la página del delivery',
                title: 'Error'
            });
        }
    },

    detallePedido: async (req, res) => {
        try {
            const pedido = await db.Pedido.findOne({
                where: { 
                    id: req.params.id, 
                    id_delivery: req.session.user.id 
                },
                include: [
                    { 
                        model: db.Comercio, 
                        as: 'comercio',
                        attributes: ['id', 'nombre_comercio', 'logo', 'telefono']
                    },
                    { 
                        model: db.Usuario, 
                        as: 'cliente',
                        attributes: ['id', 'nombre', 'apellido', 'telefono'],
                        include: [{ 
                            model: db.Direccion, 
                            as: 'direcciones',
                            attributes: ['id', 'nombre', 'descripcion']
                        }] 
                    },
                    { 
                        model: db.Producto,
                        attributes: ['id', 'nombre', 'descripcion', 'precio', 'imagen'],
                        through: { 
                            attributes: ['cantidad'],
                            as: 'pedido_producto'
                        }
                    }
                ]
            });

            if (!pedido) {
                return res.status(404).render('error', { 
                    message: 'Pedido no encontrado',
                    title: 'Error'
                });
            }

            // Obtener dirección de entrega
            const direccion = pedido.cliente.direcciones.find(d => d.id === pedido.id_direccion);

            res.render('delivery/detallePedido', { 
                user: req.session.user,
                pedido: pedido,
                direccion: direccion,
                title: `Pedido #${pedido.id}`
            });
        } catch (error) {
            console.error('Error en detallePedido:', error);
            res.status(500).render('error', { 
                message: 'Error al cargar el detalle del pedido',
                title: 'Error'
            });
        }
    },

    completarPedido: async (req, res) => {
        try {
            const pedido = await db.Pedido.findOne({
                where: { 
                    id: req.params.id, 
                    id_delivery: req.session.user.id,
                    estado: 'en proceso'
                }
            });

            if (!pedido) {
                return res.status(404).render('error', { 
                    message: 'Pedido no encontrado o no se puede completar',
                    title: 'Error'
                });
            }

            // Transacción para asegurar consistencia
            await db.sequelize.transaction(async (t) => {
                await pedido.update({ estado: 'completado' }, { transaction: t });
                await db.Usuario.update(
                    { estado: 'activo' }, 
                    { 
                        where: { id: req.session.user.id },
                        transaction: t 
                    }
                );
            });

            req.flash('success', 'Pedido marcado como completado');
            res.redirect('/delivery');
        } catch (error) {
            console.error('Error en completarPedido:', error);
            res.status(500).render('error', { 
                message: 'Error al completar el pedido',
                title: 'Error'
            });
        }
    }
};
