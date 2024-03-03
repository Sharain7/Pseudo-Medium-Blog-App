import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { decode, sign, verify } from "hono/jwt";
import { createBlogInput , updateBlogInput } from "@sharain/medium-common";
export const blogRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
  } , 
  Variables:{
    userId:string
  }
}>();

blogRouter.use("/*", async (c, next) => {
    const authHeader = c.req.header("authorization") || "";
    const authenticatedUser = await  verify(authHeader,c.env.JWT_SECRET);
    if(authenticatedUser){
        c.set("userId" , authenticatedUser.id);
        await next();
    }
    else{
       return c.json({

       })
    }
   
});

//todo - add pagination
blogRouter.get("/bulk", async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
      }).$extends(withAccelerate());
    const allBlogs = await prisma.post.findMany();
    return c.json({
        allBlogs
    })

  
});

blogRouter.get("/:id", async (c) => {
    const id = c.req.param("id")
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());
  try {
    const getBlog = await prisma.post.findFirst({
      where: {
       id: id
      },
    });
    return c.json({
        blog:getBlog
    })
  } catch (e) {
    c.status(411);
    c.text("invalid- cannot get")
  }

});

//create the blog

blogRouter.post("/", async (c) => {
  const body = await c.req.json();
  const {success} = createBlogInput.safeParse(body);
  const authorId = c.get("userId")
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());
  if(!success){
    c.status(411);
    return c.json({
      message:"Inputs are not correct"
    })
  }
  try {
    const createBlog = await prisma.post.create({
      data: {
        title: body.title,
        content: body.content,
        authorId: authorId, //take the user id from the middleware from the user id
      },
    });
    return c.json({
        id:createBlog.id
    })
  } catch (e) {
    c.status(411);
    c.text("invalid- cannot create")
  }
});
blogRouter.put("/", async(c) => {
    const body = await c.req.json();
    const {success} = updateBlogInput.safeParse(body);
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());
    if(!success){
      c.status(411);
      return c.json({
        message:"Inputs are not correct"
      })
    }
    try {
      const updatedBlog = await prisma.post.update({
       where:{
        id: body.id ,

       } , 
       data:{
        title: body.title,
        content: body.content
       }
      });
      return c.json({
          id:updatedBlog.id
      })
    } catch (e) {
      c.status(411);
      c.text("invalid- cannot update")
    }
});


