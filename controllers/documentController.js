const { Document, DuAn, User } = require('../models');
const path = require('path');
const fs = require('fs');

exports.uploadDocument = async (req, res) => {
    try {
        const file = req.file;
        const { duanId, description } = req.body;
        if (!file) return res.status(400).json({ message: 'No file uploaded' });

        // store file buffer into DB
        const generatedFilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`;
        const doc = await Document.create({
            filename: generatedFilename,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            data: file.buffer,
            duanId: duanId ? Number(duanId) : null,
            userId: req.user?.id || null,
            description: description || null,
        });

        res.json({ message: 'Upload successful', document: doc });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};

exports.listDocuments = async (req, res) => {
    try {
        const { duanId } = req.query;
        const where = {};
        if (duanId) where.duanId = Number(duanId);

        const docs = await Document.findAll({
            where,
            include: [
                { model: User, as: 'uploader', attributes: ['id', 'manv', 'hoten'] },
                { model: DuAn, as: 'duan', attributes: ['id', 'tenduan'] }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(docs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await Document.findByPk(id);
        if (!doc) return res.status(404).json({ message: 'Document not found' });

        await doc.destroy();
        res.json({ message: 'Document deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.downloadDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await Document.findByPk(id);
        if (!doc) return res.status(404).json({ message: 'Document not found' });
        // serve from DB buffer
        if (!doc.data) return res.status(404).json({ message: 'File data missing' });

        const disposition = req.query?.download === '1' ? 'attachment' : 'inline';
        res.setHeader('Content-Type', doc.mimetype || 'application/octet-stream');
        res.setHeader('Content-Disposition', `${disposition}; filename="${doc.originalname.replace(/\"/g, '')}"`);

        // send buffer
        const buffer = doc.data;
        res.send(buffer);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
