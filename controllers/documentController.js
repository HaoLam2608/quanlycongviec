const { Document, DuAn, User } = require('../models');
const { Group, GroupProject, GroupMember } = require('../models');
const { Op } = require('sequelize');
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
            attributes: ['id', 'filename', 'originalname', 'mimetype', 'size', 'duanId', 'userId', 'description', 'createdAt', 'updatedAt'],
            include: [
                { model: User, as: 'uploader', attributes: ['id', 'manv', 'hoten'] },
                { model: DuAn, as: 'duan', attributes: ['id', 'tenduan'] }
            ],
            order: [['createdAt', 'DESC']]
        });

        // Format response to match frontend expectations
        const formattedDocs = docs.map(doc => ({
            id: doc.id,
            tenTaiLieu: doc.originalname,
            fileName: doc.originalname,
            moTa: doc.description,
            duongDan: doc.filename,
            kichThuoc: doc.size,
            loaiTaiLieu: doc.mimetype,
            uploadedBy: doc.uploader?.hoten || 'Unknown',
            createdAt: doc.createdAt,
            project: doc.duan ? {
                id: doc.duan.id,
                tenduan: doc.duan.tenduan
            } : null
        }));

        res.json({ documents: formattedDocs });
    } catch (err) {
        console.error('List documents error:', err);
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

// Get documents for teamlead's group
exports.getGroupDocuments = async (req, res) => {
    try {
        const userId = req.user.id;

        // Find groups where user is leader
        const leaderGroups = await Group.findAll({
            where: { leaderId: userId, status: 'active' },
            attributes: ['id', 'duanId']
        });

        const memberLinks = await GroupMember.findAll({
            where: { userId },
            attributes: ['groupId'],
            raw: true
        });

        const memberGroupIds = memberLinks.map(link => link.groupId);

        const memberGroups = memberGroupIds.length
            ? await Group.findAll({
                where: {
                    id: { [Op.in]: memberGroupIds },
                    status: 'active'
                },
                attributes: ['id', 'duanId']
            })
            : [];

        const allGroups = [...leaderGroups, ...memberGroups];

        if (!allGroups.length) {
            return res.json({ documents: [] });
        }

        const groupProjects = await GroupProject.findAll({
            where: {
                groupId: { [Op.in]: allGroups.map(g => g.id) }
            },
            attributes: ['projectId', 'status']
        });

        const directProjectIds = allGroups
            .map(g => g.duanId)
            .filter(id => !!id);

        const relatedProjectIds = groupProjects
            .map(gp => gp.projectId)
            .filter(id => !!id);

        const projectIds = Array.from(new Set([...directProjectIds, ...relatedProjectIds]));

        // Only query by projectIds since groupId column may not exist in DB yet
        if (projectIds.length === 0) {
            return res.json({ documents: [] });
        }

        // Get all documents for these projects
        const documents = await Document.findAll({
            where: {
                duanId: { [Op.in]: projectIds }
            },
            attributes: ['id', 'filename', 'originalname', 'mimetype', 'size', 'duanId', 'userId', 'description', 'createdAt', 'updatedAt'],
            include: [
                {
                    model: User,
                    as: 'uploader',
                    attributes: ['id', 'manv', 'hoten']
                },
                {
                    model: DuAn,
                    as: 'duan',
                    attributes: ['id', 'tenduan']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        // Transform to match frontend interface
        const result = documents.map(doc => ({
            id: doc.id,
            tenTaiLieu: doc.originalname,
            fileName: doc.originalname,
            moTa: doc.description,
            duongDan: doc.filename,
            kichThuoc: doc.size,
            loaiTaiLieu: doc.mimetype,
            uploadedBy: doc.uploader?.hoten || 'Unknown',
            createdAt: doc.createdAt,
            project: doc.duan ? {
                id: doc.duan.id,
                tenduan: doc.duan.tenduan
            } : null
        }));

        res.json({ documents: result });
    } catch (err) {
        console.error('Get group documents error:', err);
        console.error('Error details:', err.stack);
        res.status(500).json({ error: err.message, details: err.stack });
    }
};
