require("dotenv").config()
const { Pool } = require("pg")
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
})

const reviews_seeder = async () => {
    try {
        const rate_2_Reviews = [
            "الشرح سطحى جداً والمنصة كل شوية تقف، والمساعدين مفيش أي رد منهم على أسئلتنا للأسف.",
            "المستر بيشرح بسرعة ومن غير تركيز، والواجبات كتير جداً على الفاضي ومفيش تصحيح ليها خالص.",
            "التجربة سيئة، السعر غالي بزيادة ومفيش أي مراجعات أو اهتمام بنظام الامتحانات الجديد بصراحة.",
            "الدعم الفني للمنصة منعدم والحصص بتتأخر بالأيام، والمساعدين أسلوبهم جاف جداً في التعامل مع الطلبة.",
            "الشرح مش أد كده ومبيدخلش في تفاصيل المنهج، والمذكرات مليانة أخطاء ومفيش أي اهتمام.",
            "مجهود ضعيف جداً من التيم، الحصة بتعلق ديماً وضيعت عليا وقت كتير ومفيش أي تعويض.",
            "المستر بيزعق كتير وقت الحصة ومب نفهمش منه حاجة، والمتابعة مع ولي الأمر غايبة تماماً.",
            "منصة معقدة وبطيئة، والمحتوى لا يستحق المبلغ المالي الكبير ده، تجربة محبطة ومش هجدد تاني.",
            "الامتحانات الدورية تعجيزية ومالهاش علاقة بالشرح، والمساعدين بيتأخروا أسابيع في الرد على الواتساب.",
            "غش في المواعيد وتأخير مستمر، والشرح كرواتة ومفيش حل أفكار كافية تضمن الدرجة النهائية."
        ];
        const rate_3_Reviews = [
            "الشرح كويس ومبسط بس المشكلة في كثرة الواجبات والضغط الزيادة اللي ملوش لزمة.",
            "المستر ممتاز جداً في الشرح بس المساعدين معاملتهم محتاجة تتصلح وتكون أفضل من كده.",
            "الحصص منظمة والشرح وافي، لكن الامتحانات الدورية صعبة ومعقدة بزيادة عن مستوى المنهج.",
            "منصة الشرح ممتازة بس أوقات كتير بتعلق، والمستر محتاج يهدى شوية وهو بيشرح.",
            "الشرح حلو وبيفهم، بس مفيش حل أفكار كتير على النظام الجديد جوة الحصة للأسف.",
            "المحتوى العلمي ممتاز ومحترم، لكن المواعيد مش مظبوطة ديماً وفيها تأخير وتأجيل كتير.",
            "المستر شاطر جداً بس المذكرات غالية بزيادة ومفيش مراعاة لظروف أولياء الأمور بصراحة.",
            "توصيل المعلومة مقبول وسلس، بس المتابعة مع ولي الأمر مش سريعة وبتتأخر شهور.",
            "المستر متمكن من مادته جداً، بس الحصة وقتها طويل وممل ومفيش بريك يفصلنا شوية.",
            "تجربة متوسطة، الشرح تمام بس المراجعات النهائية مكانتش على نفس مستوى أول السنة خالص."
        ];
        const rate_4_Reviews = [
            "الشرح عبقري بجد والامتحانات قوية، بس نتمنى الدعم الفني يحل مشكلة بطء المنصة شوية.",
            "مستمع جداً بالشرح والحل الكتير، المستر ممتاز بس المساعدين بيتأخروا في تصحيح الواجبات أحياناً.",
            "المستار بيفهم كل نقطة بالتفصيل ومذكراته تحفة، ينقصه بس تنظيم وقت الحصة بشكل أفضل.",
            "تجربة ممتازة والشرح يفتح النفس بجد، السلبية الوحيدة إن السعر غالي شوية على الطلبة.",
            "المنهج مشروح بأسلوب ممتع ومفيش كرواتة، بس الحصص أوقات بتطول بزيادة وبتفصلنا كطلبة.",
            "المستر شاطر وبيركز على نواتج التعلم، محتاجين بس امتحانات دورية أكتر عشان نثبت المعلومة.",
            "الشرح ممتاز والمراجعات مفيهاش غلطة، المساعدين بس محتاجين يكونوا أسرع في الرد على الواتساب.",
            "بفهم معاه من أول دقيقة وطريقته حديثة، لكن غياب الحصص التفاعلية المباشرة هو العيب الوحيد.",
            "محتوى محترم ومجهود كبير من المستر، والمنصة شغالة تمام بس محتاجة تحديث للشات والأسئلة.",
            "طريقة الشرح والحل ممتازة وتضمن الدرجة النهائية، بس المواعيد بتتأخر نص ساعة تقريباً ديماً."
        ];
        const rate_5_Reviews = [
            "أفضل مدرس في الجمهورية بلا منازع، شرح فوق الممتاز ومتابعة لحظية من المساعدين بجد.",
            "المنصة سريعة جداً والشرح مبسط لأبعد حد، بفضل ربنا والمستر المادة بقت أسهل مادة عندي.",
            "المستر بيشرح من قلبه وكل أفكار الامتحان بيقولها في الحصة، مذكرات عبقرية وتنظيم عالمي.",
            "تجربة مثالية ومفيش غلطة، الشرح والحل والمتابعة مع ولي الأمر قمة في الاحترافية والأمانة.",
            "شكراً يا مستر بجد على المجهود الأسطوري ده, الشرح يجنن والامتحانات بتخلينا وحوش في المادة.",
            "أسلوب الشرح ممتع جداً ومش بحس بالوقت، والمساعدين قمة في الذوق وبيردوا على أي سؤال.",
            "امتحانات الوزارة والنظام الجديد في جيبك مع المستر ده، مفيش فكرة بتفوتنا في الحصة خالص.",
            "المنصة منورة بوجود المستر، شرح وتلخيص وحل امتحانات شاملة، وفر عليا دروس خصوصية كتير بجد.",
            "تقييم خمس نجوم وقليل عليه كمان، مستر بجد محترم وبيراعي ربنا في كل طالب معاه.",
            "مستحيل تندم لو اشتركت معاه، شرح أسطوري ومراجعات نهائية بتديك الخلاصة اللي بتيجي في الامتحان."
        ];

        const student_ids = await pool.query(`SELECT id FROM users ORDER BY id`);
        const teacher_ids = await pool.query(`SELECT id FROM teachers ORDER BY id`);
        
        let queryExpressions = [];
        let queryValues = [];
        let valueIndex = 1;
        let lastIndexes = {}
        let chosenArray = []

        for (let student of student_ids.rows) {
            for (let teacher of teacher_ids.rows) {
                if (Math.random() > 0.4) {
                    continue;
                }

                let rating = 0;
                let rand = Math.random();
                let review = "";
               

                if (rand < 0.60) {
                    rating = 5;
                    chosenArray = rate_5_Reviews

                } else if (rand < 0.85) {
                    rating = 4;
                    chosenArray = rate_4_Reviews
                } else if (rand < 0.95) {
                    rating = 3;
                    chosenArray = rate_3_Reviews
                } else {
                    rating = 2;
                    chosenArray = rate_2_Reviews
                }
                let key = `${teacher.id}_${rating}`
                let newIndex = Math.floor(Math.random()* chosenArray.length )
                if (lastIndexes[key] !== undefined && lastIndexes[key] === newIndex) {
                    newIndex = (newIndex + 1) % chosenArray.length
                }
                lastIndexes[key] = newIndex
                review = chosenArray[newIndex]

              

                queryValues.push(teacher.id, student.id, review, rating);
                queryExpressions.push(`($${valueIndex},$${valueIndex + 1},$${valueIndex + 2},$${valueIndex + 3})`);
                valueIndex += 4;
            }
        }

        if (queryExpressions.length > 0) {
            await pool.query(`
                INSERT INTO reviews (teacher_id, student_id, review_text, rating)
                VALUES ${queryExpressions.join(", ")}`, queryValues);
            console.log("reviews added successfully");
        } else {
            console.log("No reviews generated due to randomness factor.");
        }

        await pool.query(`
            WITH stats AS (
                SELECT teacher_id,
                COUNT(*) AS reviews_count,
                ROUND(AVG(rating)::numeric,1) AS calc_rating
                FROM reviews r 
                GROUP BY teacher_id
            ) 
            UPDATE teachers 
            SET avg_rating = cs.calc_rating,
                total_reviews = cs.reviews_count
            FROM stats cs 
            WHERE id = cs.teacher_id`);
            
        console.log("averages and counts have been modified");

    } catch (err) {
        console.log(err);
    } finally {
        await pool.end();
        console.log("database connection closed successfully");
    }
}

reviews_seeder();