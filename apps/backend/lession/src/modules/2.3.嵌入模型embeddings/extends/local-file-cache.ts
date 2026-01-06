import { LocalFileStore } from '@langchain/classic/storage/file_system'
import fs from 'fs'
import path from 'path'

export function CacheFactory() {
    const fileStorePath = path.join(process.cwd(), 'common_file_store')
    ensureDirExistSync(fileStorePath)
    return new LocalFileStore({
        rootPath: fileStorePath,
    })
}

function ensureDirExistSync(path: string) {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path, { recursive: true })
    }
}

export const CacheProvider = {
    provide: 'Cache',
    useFactory: CacheFactory,
}
