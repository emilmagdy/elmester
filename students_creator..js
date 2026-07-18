require("dotenv").config()
const {Pool} = require("pg")

const pool = new Pool({
    connectionString : process.env.DATABASE_URL,
    ssl : {
        rejectUnauthorized :false 
    }
})

const students_creator = async () => {
      try {
        const student_names = ["احمد على","محمد مصطفى",
        "علا فالى","حنين ابراهيم",
        "يامر محمود","محمد غتيم",
        "يحيى طاهر","ريهام حسنى",
        "صفاء سعيد","طارق احمد"];
        const password = 'dummy123'
        const role = "student"
        for ( let name of student_names) {
            let email = `student_${Math.floor(Math.random() *100000)}@elmestar.com`
            const new_student = await pool.query(`
                INSERT INTO users (name,email,password_hash,role)
                VALUES ($1,$2,$3,$4)`, [name,email, password,role])
        }
        console.log("users created succefuly")
      } catch (err) {
        console.log(err , "database error")
      }
}

students_creator()
