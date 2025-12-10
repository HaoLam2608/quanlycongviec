import axiosInstance from './config'

export interface BackupSettings {
    enabled: boolean
    schedule: string
    retentionDays: number
    database: {
        host: string
        port: number
        user: string
        password: string
        name: string
    }
}

export interface BackupFile {
    fileName: string
    filePath: string
    size: string
    createdAt: string
    age: string
}

export interface BackupResult {
    success: boolean
    fileName: string
    filePath: string
    size: string
}

export const backupAPI = {
    // Get backup settings
    getSettings: async (): Promise<{ success: boolean; data: BackupSettings }> => {
        const response = await axiosInstance.get('/backup/settings')
        return response.data
    },

    // Update backup settings
    updateSettings: async (settings: Partial<BackupSettings>): Promise<{ success: boolean; message: string; data: BackupSettings }> => {
        const response = await axiosInstance.put('/backup/settings', settings)
        return response.data
    },

    // Trigger manual backup
    triggerBackup: async (): Promise<{ success: boolean; message: string; data: BackupResult }> => {
        const response = await axiosInstance.post('/backup/trigger')
        return response.data
    },

    // Get list of backups
    getBackupList: async (): Promise<{ success: boolean; data: BackupFile[] }> => {
        const response = await axiosInstance.get('/backup/list')
        return response.data
    },

    // Download backup file
    downloadBackup: async (fileName: string) => {
        const response = await axiosInstance.get(`/backup/download/${fileName}`, {
            responseType: 'blob'
        })
        
        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', fileName)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
    },

    // Delete backup file
    deleteBackup: async (fileName: string): Promise<{ success: boolean; message: string }> => {
        const response = await axiosInstance.delete(`/backup/${fileName}`)
        return response.data
    },

    // Restore database from backup
    restoreBackup: async (fileName: string): Promise<{ success: boolean; message: string }> => {
        const response = await axiosInstance.post('/backup/restore', { fileName })
        return response.data
    }
}
