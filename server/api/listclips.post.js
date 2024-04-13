export default defineEventHandler(async (event)=>{
    if(!event.context.user){
        return
    }
    const clips = await sql`select clips from auth_user where id=${event.context.user.id}`
    console.log(clips)
    const result = await sql`select * from paper_data where paper_id IN(${clips[0].clips})`
    console.log(result)
    return result
})