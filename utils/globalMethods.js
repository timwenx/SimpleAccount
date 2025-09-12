
 export function  saveStorageAndFile(key,value) {
  console.log("存储-key:{},value:{}",key,value);
	uni.setStorageSync(key, value);
  // #ifdef APP-PLUS
    try{
      let obj = [];
      uni.getStorageInfoSync().keys.forEach(e => {
        if (e) {
        let o = {};
        o[e] = uni.getStorageSync(e);
        obj[obj.length] = o;
        }
      });
      const recordCount = obj.length;
      const fileName = 'record_info.json';
      this.$saveJSONToDCIM(JSON.stringify(obj), recordCount, fileName);
    }catch(e){
      console.log("error",e)
    }
	// #endif
  }

 export function  saveJSONToDCIM(jsonContent, recordCount, fileName = 'record_info.json') {
    console.log('=== 开始保存JSON到外部公共存储 ===');
    console.log('文件名:', fileName);
    console.log('记录数量:', recordCount);

    this.$checkStoragePermission().then(() => {
      try {
        const Environment = plus.android.importClass('android.os.Environment');
        const File = plus.android.importClass('java.io.File');
        const FileOutputStream = plus.android.importClass('java.io.FileOutputStream');
        const OutputStreamWriter = plus.android.importClass('java.io.OutputStreamWriter');

        const state = Environment.getExternalStorageState();
        if (state !== Environment.MEDIA_MOUNTED) {
          throw new Error('外部存储不可用');
        }

        let publicDownloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);

        if (publicDownloadsDir === null || publicDownloadsDir === undefined) {
          const externalStorageDir = Environment.getExternalStorageDirectory();
          if (externalStorageDir !== null) {
            publicDownloadsDir = new File(externalStorageDir, 'Download');
            console.log('使用备用下载目录路径:', publicDownloadsDir.getAbsolutePath());
          } else {
            throw new Error('无法获取任何外部存储目录，设备可能不支持');
          }
        } else {
          console.log('公共下载目录:', publicDownloadsDir.getAbsolutePath());
        }

        if (!publicDownloadsDir.exists()) {
          const created = publicDownloadsDir.mkdirs();
          if (!created) {
            throw new Error('下载目录不存在且无法创建');
          }
        }

        if (!publicDownloadsDir.canWrite()) {
          throw new Error('下载目录不可写，请检查权限');
        }

        const accountDataDir = new File(publicDownloadsDir, 'AccountData');
        if (!accountDataDir.exists()) {
          const created = accountDataDir.mkdirs();
          console.log('创建AccountData目录结果:', created);
          if (!created) {
            throw new Error('无法创建AccountData目录');
          }
        }

        const jsonFile = new File(accountDataDir, fileName);
        const absolutePath = jsonFile.getAbsolutePath();
        console.log('目标文件完整路径:', absolutePath);

        if (jsonFile.exists()) {
          jsonFile.delete();
        }

        const fos = new FileOutputStream(jsonFile);
        const writer = new OutputStreamWriter(fos, 'UTF-8');

        const bom = '\ufeff';
        const fullContent = bom + jsonContent;

        writer.write(fullContent);
        writer.flush();
        writer.close();
        fos.close();

        const fileSize = jsonFile.length();
        console.log('JSON文件写入完成，大小:', fileSize);

      } catch (error) {
        console.error('原生文件操作失败:', error);
      }
    }).catch((err) => {
      console.error('存储权限检查失败:', err);
      uni.showModal({
        title: '权限不足',
        content: '需要存储权限才能保存到公共目录。请在应用设置中授予存储权限。',
        showCancel: true,
        confirmText: '去设置',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            const Intent = plus.android.importClass('android.content.Intent');
            const Settings = plus.android.importClass('android.provider.Settings');
            const Uri = plus.android.importClass('android.net.Uri');
            const main = plus.android.runtimeMainActivity();

            const intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            const uri = Uri.fromParts('package', main.getPackageName(), null);
            intent.setData(uri);
            main.startActivity(intent);
          }
        }
      });
    });
  }

 export function  checkStoragePermission() {
    return new Promise((resolve, reject) => {
      const Context = plus.android.importClass('android.content.Context');
      const PackageManager = plus.android.importClass('android.content.pm.PackageManager');
      const Manifest = plus.android.importClass('android.Manifest');
      const main = plus.android.runtimeMainActivity();

      const writePermission = main.checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE);
      const readPermission = main.checkSelfPermission(Manifest.permission.READ_EXTERNAL_STORAGE);

      if (writePermission === PackageManager.PERMISSION_GRANTED && 
          readPermission === PackageManager.PERMISSION_GRANTED) {
        console.log('存储权限已授予');
        resolve();
      } else {
        console.log('存储权限未授予，尝试请求权限');
        const ActivityCompat = plus.android.importClass('androidx.core.app.ActivityCompat');
        ActivityCompat.requestPermissions(main, [
          Manifest.permission.WRITE_EXTERNAL_STORAGE,
          Manifest.permission.READ_EXTERNAL_STORAGE
        ], 1001);

        setTimeout(() => {
          const newWritePermission = main.checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE);
          const newReadPermission = main.checkSelfPermission(Manifest.permission.READ_EXTERNAL_STORAGE);

          if (newWritePermission === PackageManager.PERMISSION_GRANTED && 
              newReadPermission === PackageManager.PERMISSION_GRANTED) {
            resolve();
          } else {
            reject(new Error('用户未授予存储权限'));
          }
        }, 2000);
      }
    });
  }
