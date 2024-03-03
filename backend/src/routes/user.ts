import { Hono } from "hono";
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { decode, sign, verify } from 'hono/jwt'
import { signinInput , signupInput } from "@sharain/medium-common";


export const userRouter = new Hono<{
    Bindings:{
      DATABASE_URL: string;
      JWT_SECRET: string
    }
  
  }>()

userRouter.post('/signup' , async  (c) =>{
    const body  = await c.req.json();
    const {success} = signupInput.safeParse(body); 
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate())
  if(!success){
    c.status(411);
    return c.json({
      message:"Inputs are not correct"
    })
  }
  try{
    const newUser = await prisma.user.create({
      data:{
        name: body.name,
        password: body.password , 
        username:body.username , 
    
      }
    
    
    })
    const jwt = await sign({
      id: newUser.id
  
    } , c.env.JWT_SECRET)
    return c.text(jwt)
  }catch(e){
    c.status(411);
    return c.text('Invalid')
  
  
  
  }
  
    
  })
  userRouter.post('/signin' , async (c) =>{
    
    const body  = await c.req.json();
    const {success} = signinInput.safeParse(body); 
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate())
  
  if(!success){
    c.status(411);
    return c.json({
      message:"Inputs are not correct"
    })
  }
  try{
    const user = await prisma.user.findFirst({
      where:{
        
        password: body.password , 
        username:body.username , 
      }
    
    
    })
    if(!user){
      c.status(403) //common code for unauthorised
      return c.text("Your account does not exist, please sign up")
    }
    const jwt = await sign({
      id: user.id , 
  
    } , c.env.JWT_SECRET)
    return c.text(jwt)
  }catch(e){
    c.status(411);
    return c.text('Invalid')
  
  
  
  }
  })