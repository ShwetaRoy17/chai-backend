import multer from "multer";
// import 'fs'
const storage = multer.diskStorage({
    destination:function (req,file,cb){
        // file.save('./public',+ file.originalname)
        cb(null,"./uploads")
    },
    filename: function (req,file, cb){
        cb(null,file.originalname)
    }
})


export const upload = multer({storage:storage})