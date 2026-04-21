/**
 * 通用文件上传工具（支持多文件，最多3个）
 * 上传接口：/file/upload_file
 * 返回：上传成功的文件列表 { filename, url }
 */
export async function uploadFiles() {
    return new Promise((resolve, reject) => {
        // 1. 选择文件（最多3个，不限类型）
        uni.chooseImage({
            count: 3,
            sizeType: ['compressed'],
            // 允许相册 + 拍照（如果要纯文件选择，可改成 type:all）
            sourceType: ['album', 'camera'],
            success: async (res) => {
                const tempFilePaths = res.tempFilePaths
                const uploadResults = []

                try {
                    // 2. 循环上传
                    for (const filePath of tempFilePaths) {
                        const result = await uploadSingleFile(filePath)
                        uploadResults.push(result)
                    }

                    // 3. 返回所有成功上传的文件
                    resolve(uploadResults)
                } catch (err) {
                    reject(err)
                }
            },
            fail: (err) => {
                reject(err)
            }
        })
    })
}

/**
 * 上传单个文件（内部方法）
 * @param {string} filePath 临时文件路径
 * @returns {Promise<{filename, url}>}
 */
function uploadSingleFile(filePath) {
    return new Promise((resolve, reject) => {
        uni.showLoading({ title: '上传中...' })

        uni.uploadFile({
            url: 'http://127.0.0.1:8000/file/upload_file',
            filePath: filePath,
            name: 'file',
            method: 'POST',
            success: (uploadRes) => {
                try {
                    const data = JSON.parse(uploadRes.data)
                    if (data.code === 200 || data.code === '200') {
                        resolve(data.data)
                    } else {
                        uni.showToast({
                            title: data.msg || '上传失败',
                            icon: 'none'
                        })
                        reject(data.msg)
                    }
                } catch (e) {
                    uni.showToast({ title: '解析失败', icon: 'none' })
                    reject(e)
                }
            },
            fail: () => {
                uni.showToast({ title: '上传请求失败', icon: 'none' })
                reject('上传失败')
            },
            complete: () => {
                uni.hideLoading()
            }
        })
    })
}


/**
 * 通用单文件上传（对外暴露，页面直接调用）
 * @param {string} filePath 临时文件路径
 * @returns {Promise<{filename: string, url: string}>} 上传结果
 */
export async function uploadSingleSpeciallyFile(filePath) {
    return new Promise((resolve, reject) => {
        // ================== 可选：图片格式校验（取消注释即可开启） ==================
        // const extMatch = filePath.match(/\.(\w+)$/)
        // const ext = extMatch ? extMatch[1].toLowerCase() : ''
        // const allowExt = ['jpg', 'jpeg', 'png']
        // if (!allowExt.includes(ext)) {
        //   uni.showToast({ title: '仅支持 jpg、jpeg、png', icon: 'none' })
        //   reject('格式不支持')
        //   return
        // }

        uni.showLoading({ title: '上传中...' })

        uni.uploadFile({
            url: 'http://127.0.0.1:8000/file/upload_file',
            filePath: filePath,
            name: 'file',
            method: 'POST',
            success: (uploadRes) => {
                try {
                    const data = JSON.parse(uploadRes.data)
                    if (data.code === 200 || data.code === '200') {
                        resolve(data.data)
                    } else {
                        uni.showToast({ title: data.msg || '上传失败', icon: 'none' })
                        reject(data.msg)
                    }
                } catch (e) {
                    uni.showToast({ title: '上传解析失败', icon: 'none' })
                    reject(e)
                }
            },
            fail: () => {
                uni.showToast({ title: '上传请求失败', icon: 'none' })
                reject('上传失败')
            },
            complete: () => {
                uni.hideLoading()
            }
        })
    })
}