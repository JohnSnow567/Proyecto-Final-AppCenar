const db = require('../../models');
const bcrypt = require('bcrypt');

module.exports = {
    mostrarPerfil: async (req, res) => {
        try {
            const usuario = await db.Usuario.findByPk(req.session.user.id, {
                attributes: ['id', 'nombre', 'apellido', 'correo', 'telefono', 'foto', 'usuario']
            });

            res.render('delivery/perfil', { 
                user: req.session.user,
                usuario: usuario,
                title: 'Mi Perfil'
            });
        } catch (error) {
            console.error('Error en mostrarPerfil:', error);
            res.status(500).render('error', { 
                message: 'Error al cargar el perfil',
                title: 'Error'
            });
        }
    },

    actualizarPerfil: async (req, res) => {
        try {
            const { nombre, apellido, telefono, password, confirmPassword } = req.body;
            
            // Validaciones básicas
            if (!nombre || !apellido || !telefono) {
                req.flash('error', 'Nombre, apellido y teléfono son requeridos');
                return res.redirect('/delivery/perfil');
            }

            if (password && password !== confirmPassword) {
                req.flash('error', 'Las contraseñas no coinciden');
                return res.redirect('/delivery/perfil');
            }

            const updateData = {
                nombre,
                apellido,
                telefono
            };

            // Actualizar foto si se subió una nueva
            if (req.file) {
                updateData.foto = `/uploads/${req.file.filename}`;
            }

            // Actualizar contraseña si se proporcionó
            if (password) {
                updateData.contrasena = await bcrypt.hash(password, 10);
            }

            await db.Usuario.update(updateData, { 
                where: { id: req.session.user.id } 
            });

            // Actualizar datos en la sesión
            req.session.user.nombre = nombre;
            req.session.user.apellido = apellido;
            req.session.user.telefono = telefono;
            if (req.file) {
                req.session.user.foto = updateData.foto;
            }

            req.flash('success', 'Perfil actualizado correctamente');
            res.redirect('/delivery/perfil');
        } catch (error) {
            console.error('Error en actualizarPerfil:', error);
            res.status(500).render('error', { 
                message: 'Error al actualizar el perfil',
                title: 'Error'
            });
        }
    }
};
