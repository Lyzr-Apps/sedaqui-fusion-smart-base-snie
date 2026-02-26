'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import parseLLMJson from '@/lib/jsonParser'
import { getDocuments, uploadAndTrainDocument, deleteDocuments, crawlWebsite } from '@/lib/ragKnowledgeBase'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { Separator } from '@/components/ui/separator'
import { FiShoppingCart, FiMail, FiSend, FiUpload, FiTrash2, FiChevronRight, FiChevronLeft, FiX, FiPlus, FiMinus, FiCheck, FiAlertCircle, FiPackage, FiCpu, FiBook, FiGlobe, FiShield, FiAward, FiZap, FiTag, FiMessageSquare, FiGrid, FiTruck, FiDownload, FiLoader, FiRefreshCw, FiHeart, FiArrowRight, FiLayers, FiDatabase, FiFileText, FiGift, FiKey, FiMapPin } from 'react-icons/fi'

// === CONSTANTS ===
const AGENT_IDS = {
  DIGITAL_PRODUCT: '699f3284491a682589955950',
  SMART_SHOP: '699f3284f13aaac966413d92',
  AI_STOREFRONT: '699f3285baa7d9b4a230cbe2',
  CUSTOMER_SUPPORT: '699f32a1baa7d9b4a230cbe8',
  ORDER_FULFILLMENT: '699f32b4d19ec1f1c4d3e7fe',
}

const RAG_ID = '699f328500c2d274880ef763'

const ASSETS = {
  logo: 'https://asset.lyzr.app/16YdmFUi',
  digitalHub: 'https://asset.lyzr.app/S8EbyoOX',
  smartShop: 'https://asset.lyzr.app/cvP26XfM',
  aiAgents: 'https://asset.lyzr.app/FDcYeozK',
}

const THEME_VARS = {
  '--background': '30 8% 6%',
  '--foreground': '30 10% 90%',
  '--card': '30 6% 9%',
  '--card-foreground': '30 10% 90%',
  '--popover': '30 5% 12%',
  '--popover-foreground': '30 10% 90%',
  '--primary': '40 50% 55%',
  '--primary-foreground': '30 8% 6%',
  '--secondary': '30 5% 14%',
  '--secondary-foreground': '30 10% 85%',
  '--accent': '40 60% 60%',
  '--accent-foreground': '30 8% 6%',
  '--destructive': '0 50% 50%',
  '--destructive-foreground': '0 0% 100%',
  '--muted': '30 5% 18%',
  '--muted-foreground': '30 8% 55%',
  '--border': '30 6% 20%',
  '--input': '30 5% 25%',
  '--ring': '40 50% 55%',
  '--radius': '0rem',
  '--chart-1': '40 50% 55%',
  '--chart-2': '30 30% 45%',
  '--chart-3': '200 20% 50%',
  '--chart-4': '0 0% 50%',
  '--chart-5': '30 10% 40%',
  '--sidebar-background': '30 7% 7%',
  '--sidebar-foreground': '30 10% 90%',
  '--sidebar-border': '30 6% 16%',
  '--sidebar-primary': '40 50% 55%',
  '--sidebar-primary-foreground': '30 8% 6%',
  '--sidebar-accent': '30 5% 12%',
  '--sidebar-accent-foreground': '30 10% 90%',
} as React.CSSProperties

// === TYPES ===
interface CartItem {
  id: string
  title: string
  price: number
  quantity: number
  category: string
  type: 'digital' | 'physical' | 'ai-agent'
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  followUp?: string
  category?: string
}

interface SampleProduct {
  id: string
  title: string
  description: string
  price: number
  category: string
  type: 'digital' | 'physical' | 'ai-agent'
  tags?: string[]
  image?: string
}

// === SAMPLE DATA ===
const SAMPLE_DIGITAL_PRODUCTS: SampleProduct[] = [
  { id: 'd-free', title: 'Introduction to AI - Free Sample', description: 'A complimentary introductory guide to artificial intelligence fundamentals. Download instantly to experience SEDAQUI digital delivery.', price: 0.00, category: 'E-books', type: 'digital', tags: ['AI', 'Free Sample', 'Beginner'], image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop&q=80' },
  { id: 'd1', title: 'Mastering TypeScript', description: 'A comprehensive guide to advanced TypeScript patterns and enterprise architecture.', price: 29.99, category: 'E-books', type: 'digital', tags: ['Programming', 'TypeScript'], image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=300&fit=crop&q=80' },
  { id: 'd2', title: 'UX Design Fundamentals', description: 'Learn user experience design principles from industry experts with hands-on projects.', price: 49.99, category: 'Courses', type: 'digital', tags: ['Design', 'UX'], image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop&q=80' },
  { id: 'd3', title: 'Cloud Deployment Toolkit', description: 'SaaS tool for automating multi-cloud infrastructure deployments and monitoring.', price: 19.99, category: 'SaaS Tools', type: 'digital', tags: ['DevOps', 'Cloud'], image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=300&fit=crop&q=80' },
  { id: 'd4', title: 'Data Science with Python', description: 'End-to-end data science workflow using Python, Pandas, and Scikit-learn.', price: 39.99, category: 'Courses', type: 'digital', tags: ['Data Science', 'Python'], image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop&q=80' },
  { id: 'd5', title: 'Brand Identity Blueprint', description: 'Step-by-step guide to building a memorable brand identity from scratch.', price: 14.99, category: 'E-books', type: 'digital', tags: ['Branding', 'Marketing'], image: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=400&h=300&fit=crop&q=80' },
  { id: 'd6', title: 'Invoicer Pro', description: 'Automated invoicing and billing application for freelancers and agencies.', price: 9.99, category: 'Apps', type: 'digital', tags: ['Finance', 'Productivity'], image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop&q=80' },
]

const SAMPLE_PHYSICAL_PRODUCTS: SampleProduct[] = [
  { id: 'p-free', title: 'Premium Sticker Pack - Free Gift', description: 'A complimentary set of premium holographic stickers. Ships free to verify our delivery quality and speed.', price: 0.00, category: 'Fashion', type: 'physical', tags: ['Free Gift', 'Stickers', 'Collectible'], image: 'https://images.unsplash.com/photo-1572375992501-4b0892d50c69?w=400&h=300&fit=crop&q=80' },
  { id: 'p1', title: 'Wireless Noise-Cancelling Headphones', description: 'Premium over-ear headphones with 40-hour battery life and active noise cancellation.', price: 89.99, category: 'Electronics', type: 'physical', tags: ['Audio', 'Wireless'], image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop&q=80' },
  { id: 'p2', title: 'Minimalist Leather Wallet', description: 'Handcrafted genuine leather wallet with RFID blocking technology.', price: 34.99, category: 'Fashion', type: 'physical', tags: ['Leather', 'Accessories'], image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&h=300&fit=crop&q=80' },
  { id: 'p3', title: 'Smart Home Diffuser', description: 'WiFi-enabled essential oil diffuser with app control and scheduling.', price: 45.99, category: 'Home', type: 'physical', tags: ['Smart Home', 'Wellness'], image: 'https://images.unsplash.com/photo-1602928321679-560bb453f190?w=400&h=300&fit=crop&q=80' },
  { id: 'p4', title: 'Resistance Band Set', description: 'Professional-grade latex resistance bands with door anchor and carry bag.', price: 24.99, category: 'Fitness', type: 'physical', tags: ['Exercise', 'Home Gym'], image: 'https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=400&h=300&fit=crop&q=80' },
  { id: 'p5', title: 'Ergonomic Desk Lamp', description: 'LED desk lamp with adjustable color temperature and USB charging port.', price: 52.99, category: 'Electronics', type: 'physical', tags: ['Lighting', 'Office'], image: 'https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=400&h=300&fit=crop&q=80' },
  { id: 'p6', title: 'Organic Cotton Hoodie', description: 'Sustainably made oversized hoodie with premium organic cotton blend.', price: 59.99, category: 'Fashion', type: 'physical', tags: ['Sustainable', 'Clothing'], image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=300&fit=crop&q=80' },
]

const SAMPLE_AI_AGENTS: SampleProduct[] = [
  { id: 'a-free', title: 'QuickCalc AI - Free Trial', description: 'A free AI calculator and unit converter agent. Try it out to experience how SEDAQUI AI agents work before purchasing premium agents.', price: 0.00, category: 'Productivity', type: 'ai-agent', tags: ['Free Trial', 'Calculator', 'Utility'], image: 'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?w=400&h=300&fit=crop&q=80' },
  { id: 'a1', title: 'FitCoach AI', description: 'Personal fitness coach that creates custom workout plans and tracks your progress.', price: 9.99, category: 'Fitness', type: 'ai-agent', tags: ['Workout', 'Health'], image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=300&fit=crop&q=80' },
  { id: 'a2', title: 'LinguaBot', description: 'Conversational language tutor supporting 15+ languages with real-time pronunciation feedback.', price: 14.99, category: 'Language', type: 'ai-agent', tags: ['Learning', 'Languages'], image: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=400&h=300&fit=crop&q=80' },
  { id: 'a3', title: 'ChefMate AI', description: 'Recipe generator and meal planner based on your dietary preferences and ingredients.', price: 7.99, category: 'Cooking', type: 'ai-agent', tags: ['Recipes', 'Nutrition'], image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&h=300&fit=crop&q=80' },
  { id: 'a4', title: 'BizStrategy Pro', description: 'AI business consultant for market analysis, competitive research, and strategic planning.', price: 24.99, category: 'Business', type: 'ai-agent', tags: ['Strategy', 'Analytics'], image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop&q=80' },
  { id: 'a5', title: 'StudyBuddy AI', description: 'Intelligent study companion that generates flashcards, quizzes, and study schedules.', price: 5.99, category: 'Study', type: 'ai-agent', tags: ['Education', 'Flashcards'], image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop&q=80' },
  { id: 'a6', title: 'TaskFlow Agent', description: 'Productivity assistant for task management, calendar optimization, and daily planning.', price: 12.99, category: 'Productivity', type: 'ai-agent', tags: ['Tasks', 'Planning'], image: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=400&h=300&fit=crop&q=80' },
]

// === HELPERS ===
function parseAgentResponse(result: any) {
  if (!result) return null
  let parsed: any = null
  if (typeof result?.response === 'string') {
    parsed = parseLLMJson(result.response)
  } else if (result?.response?.result) {
    parsed = result.response.result
    if (typeof parsed === 'string') {
      parsed = parseLLMJson(parsed)
    }
  } else if (result?.response?.message) {
    parsed = parseLLMJson(result.response.message)
  }
  if (parsed && typeof parsed === 'object' && 'result' in parsed && typeof parsed.result === 'object') {
    parsed = parsed.result
  }
  return parsed
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h4 key={i} className="font-normal text-sm mt-3 mb-1 tracking-widest">{line.slice(4)}</h4>
        if (line.startsWith('## ')) return <h3 key={i} className="font-normal text-base mt-3 mb-1 tracking-widest">{line.slice(3)}</h3>
        if (line.startsWith('# ')) return <h2 key={i} className="font-medium text-lg mt-4 mb-2 tracking-widest">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-sm font-light leading-relaxed">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line)) return <li key={i} className="ml-4 list-decimal text-sm font-light leading-relaxed">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm font-light leading-relaxed">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-normal">{part}</strong> : part)
}

// === ERROR BOUNDARY ===
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-normal mb-2 tracking-widest">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm font-light">{this.state.error}</p>
            <button onClick={() => this.setState({ hasError: false, error: '' })} className="px-4 py-2 bg-primary text-primary-foreground text-sm tracking-widest">Try again</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// === SUB COMPONENTS ===

function SiteHeader({ currentPage, setCurrentPage, cartCount, onCartOpen }: { currentPage: string; setCurrentPage: (p: string) => void; cartCount: number; onCartOpen: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const navItems = [
    { key: 'home', label: 'HOME' },
    { key: 'digital', label: 'DIGITAL HUB' },
    { key: 'shop', label: 'SMART SHOP' },
    { key: 'agents', label: 'AI AGENT STORE' },
    { key: 'contact', label: 'CONTACT' },
    { key: 'admin', label: 'ADMIN' },
  ]
  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-primary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button onClick={() => setCurrentPage('home')} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src={ASSETS.logo} alt="SEDAQUI" className="h-8 w-8 object-contain" />
            <span className="text-lg font-normal tracking-widest text-primary font-serif">SEDAQUI</span>
          </button>
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map(item => (
              <button key={item.key} onClick={() => setCurrentPage(item.key)} className={`px-3 py-2 text-xs tracking-widest transition-colors font-light ${currentPage === item.key ? 'text-primary border-b border-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                {item.label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <button onClick={onCartOpen} className="relative text-foreground hover:text-primary transition-colors p-2">
              <FiShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs w-5 h-5 flex items-center justify-center font-light">{cartCount}</span>
              )}
            </button>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 text-foreground">
              <FiGrid size={20} />
            </button>
          </div>
        </div>
      </div>
      {mobileOpen && (
        <div className="lg:hidden border-t border-border bg-background">
          <nav className="flex flex-col p-4 space-y-2">
            {navItems.map(item => (
              <button key={item.key} onClick={() => { setCurrentPage(item.key); setMobileOpen(false) }} className={`text-left px-3 py-2 text-xs tracking-widest font-light transition-colors ${currentPage === item.key ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}

function CartDrawer({ cart, setCart, open, onClose }: { cart: CartItem[]; setCart: React.Dispatch<React.SetStateAction<CartItem[]>>; open: boolean; onClose: () => void }) {
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'checkout' | 'confirmation'>('cart')
  const [checkoutForm, setCheckoutForm] = useState({ name: '', email: '', street: '', city: '', state: '', zip: '' })
  const [orderNumber, setOrderNumber] = useState('')
  const [fulfillmentResult, setFulfillmentResult] = useState<any>(null)
  const [fulfillmentLoading, setFulfillmentLoading] = useState(false)

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const hasPhysical = cart.some(item => item.type === 'physical')

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item))
  }
  const removeItem = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id))
  }

  const generateOrderNumber = () => {
    return 'ORD-' + Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  const generateAccessKey = () => {
    const seg = () => Math.random().toString(36).substring(2, 6).toUpperCase()
    return `SEDAQUI-AI-${seg()}-${seg()}`
  }

  const handleCheckout = async () => {
    if (!checkoutForm.name || !checkoutForm.email) return
    if (hasPhysical && (!checkoutForm.street || !checkoutForm.city || !checkoutForm.state || !checkoutForm.zip)) return

    const ordNum = generateOrderNumber()
    setOrderNumber(ordNum)
    setCheckoutStep('confirmation')

    // Call Order Fulfillment Agent in the background
    setFulfillmentLoading(true)
    try {
      const productList = cart.map(item => `${item.title} (x${item.quantity})`).join(', ')
      const orderType = cart.every(c => c.type === 'digital') ? 'Digital' : cart.every(c => c.type === 'physical') ? 'Physical' : cart.every(c => c.type === 'ai-agent') ? 'AI Agent' : 'Mixed'
      const msg = `Send order confirmation to ${checkoutForm.name} at ${checkoutForm.email}. Order #${ordNum}. Products: ${productList}. Order type: ${orderType}.`
      const res = await callAIAgent(msg, AGENT_IDS.ORDER_FULFILLMENT)
      const parsed = parseAgentResponse(res)
      setFulfillmentResult(parsed)
    } catch {
      // Silent - confirmation still shown
    } finally {
      setFulfillmentLoading(false)
    }
  }

  const handleFinish = () => {
    setCart([])
    setCheckoutStep('cart')
    setCheckoutForm({ name: '', email: '', street: '', city: '', state: '', zip: '' })
    setOrderNumber('')
    setFulfillmentResult(null)
    onClose()
  }

  const handleClose = () => {
    if (checkoutStep === 'confirmation') {
      handleFinish()
    } else {
      setCheckoutStep('cart')
      onClose()
    }
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/60" onClick={handleClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-card border-l border-border">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-lg font-normal tracking-widest text-foreground">
              {checkoutStep === 'cart' ? 'YOUR CART' : checkoutStep === 'checkout' ? 'CHECKOUT' : 'ORDER CONFIRMED'}
            </h2>
            <button onClick={handleClose} className="text-muted-foreground hover:text-foreground"><FiX size={20} /></button>
          </div>

          {checkoutStep === 'cart' && (
            <>
              <ScrollArea className="flex-1 p-6">
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <FiShoppingCart size={40} className="mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-sm font-light tracking-widest">Your cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map(item => (
                      <div key={item.id} className="flex items-center gap-4 p-4 border border-border bg-secondary/30">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-light tracking-wider text-foreground truncate">{item.title}</p>
                          <p className="text-xs text-muted-foreground font-light mt-1">{item.price === 0 ? 'FREE' : `$${item.price.toFixed(2)}`}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateQty(item.id, -1)} className="p-1 text-muted-foreground hover:text-foreground"><FiMinus size={14} /></button>
                          <span className="text-sm font-light w-6 text-center">{item.quantity}</span>
                          <button onClick={() => updateQty(item.id, 1)} className="p-1 text-muted-foreground hover:text-foreground"><FiPlus size={14} /></button>
                        </div>
                        <button onClick={() => removeItem(item.id)} className="p-1 text-muted-foreground hover:text-destructive"><FiTrash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              {cart.length > 0 && (
                <div className="p-6 border-t border-border space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground font-light tracking-widest">SUBTOTAL</span>
                    <span className="text-foreground font-normal">{subtotal === 0 ? 'FREE' : `$${subtotal.toFixed(2)}`}</span>
                  </div>
                  <Button className="w-full tracking-widest font-light" onClick={() => setCheckoutStep('checkout')}>PROCEED TO CHECKOUT</Button>
                </div>
              )}
            </>
          )}

          {checkoutStep === 'checkout' && (
            <>
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-4">
                  <div className="border border-border p-4 bg-secondary/20 space-y-2 mb-4">
                    <p className="text-xs tracking-widest text-muted-foreground font-light">ORDER SUMMARY</p>
                    {cart.map(item => (
                      <div key={item.id} className="flex justify-between text-sm font-light">
                        <span className="text-foreground truncate flex-1">{item.title} x{item.quantity}</span>
                        <span className="text-primary ml-2">{item.price === 0 ? 'FREE' : `$${(item.price * item.quantity).toFixed(2)}`}</span>
                      </div>
                    ))}
                    <Separator className="bg-border" />
                    <div className="flex justify-between text-sm font-normal">
                      <span className="text-foreground tracking-widest">TOTAL</span>
                      <span className="text-primary">{subtotal === 0 ? 'FREE' : `$${subtotal.toFixed(2)}`}</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs tracking-widest font-light">FULL NAME *</Label>
                    <Input value={checkoutForm.name} onChange={e => setCheckoutForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Your full name" className="mt-1 bg-secondary/30 border-border" />
                  </div>
                  <div>
                    <Label className="text-xs tracking-widest font-light">EMAIL ADDRESS *</Label>
                    <Input type="email" value={checkoutForm.email} onChange={e => setCheckoutForm(prev => ({ ...prev, email: e.target.value }))} placeholder="your@email.com" className="mt-1 bg-secondary/30 border-border" />
                  </div>

                  {hasPhysical && (
                    <>
                      <Separator className="bg-border" />
                      <p className="text-xs tracking-widest text-muted-foreground font-light flex items-center gap-2"><FiMapPin size={12} /> SHIPPING ADDRESS</p>
                      <div>
                        <Label className="text-xs tracking-widest font-light">STREET *</Label>
                        <Input value={checkoutForm.street} onChange={e => setCheckoutForm(prev => ({ ...prev, street: e.target.value }))} placeholder="123 Main Street" className="mt-1 bg-secondary/30 border-border" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs tracking-widest font-light">CITY *</Label>
                          <Input value={checkoutForm.city} onChange={e => setCheckoutForm(prev => ({ ...prev, city: e.target.value }))} placeholder="City" className="mt-1 bg-secondary/30 border-border" />
                        </div>
                        <div>
                          <Label className="text-xs tracking-widest font-light">STATE *</Label>
                          <Input value={checkoutForm.state} onChange={e => setCheckoutForm(prev => ({ ...prev, state: e.target.value }))} placeholder="State" className="mt-1 bg-secondary/30 border-border" />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs tracking-widest font-light">ZIP CODE *</Label>
                        <Input value={checkoutForm.zip} onChange={e => setCheckoutForm(prev => ({ ...prev, zip: e.target.value }))} placeholder="12345" className="mt-1 bg-secondary/30 border-border" />
                      </div>
                    </>
                  )}
                </div>
              </ScrollArea>
              <div className="p-6 border-t border-border space-y-3">
                <Button className="w-full tracking-widest font-light" onClick={handleCheckout} disabled={!checkoutForm.name || !checkoutForm.email || (hasPhysical && (!checkoutForm.street || !checkoutForm.city || !checkoutForm.state || !checkoutForm.zip))}>
                  COMPLETE ORDER
                </Button>
                <button onClick={() => setCheckoutStep('cart')} className="w-full text-center text-xs text-muted-foreground tracking-widest font-light hover:text-foreground transition-colors py-2">
                  BACK TO CART
                </button>
              </div>
            </>
          )}

          {checkoutStep === 'confirmation' && (
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-6">
                <div className="text-center py-4">
                  <div className="w-16 h-16 mx-auto bg-green-600/20 border border-green-600/40 flex items-center justify-center mb-4">
                    <FiCheck size={32} className="text-green-500" />
                  </div>
                  <h3 className="text-lg font-normal tracking-widest text-foreground mb-1">ORDER PLACED</h3>
                  <p className="text-xs text-muted-foreground font-light tracking-wider">Order #{orderNumber}</p>
                  <p className="text-xs text-muted-foreground font-light mt-1">Confirmation will be sent to {checkoutForm.email}</p>
                </div>

                <Separator className="bg-border" />

                <div className="space-y-3">
                  <p className="text-xs tracking-widest text-muted-foreground font-light">YOUR PRODUCTS</p>
                  {cart.map(item => (
                    <div key={item.id} className="border border-border p-4 bg-secondary/20 space-y-2">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-light tracking-wider text-foreground">{item.title}</p>
                        <span className="text-xs text-primary font-light">{item.price === 0 ? 'FREE' : `$${(item.price * item.quantity).toFixed(2)}`}</span>
                      </div>
                      {item.type === 'digital' && (
                        <div className="bg-primary/10 border border-primary/30 p-3 flex items-center gap-3">
                          <FiDownload size={16} className="text-primary flex-shrink-0" />
                          <div>
                            <p className="text-xs font-light tracking-wider text-foreground">Ready to download</p>
                            <button className="text-xs text-primary tracking-widest font-light hover:underline mt-1 flex items-center gap-1">
                              <FiDownload size={12} /> DOWNLOAD {item.title.toUpperCase().slice(0, 30)}
                            </button>
                          </div>
                        </div>
                      )}
                      {item.type === 'ai-agent' && (
                        <div className="bg-primary/10 border border-primary/30 p-3 flex items-center gap-3">
                          <FiKey size={16} className="text-primary flex-shrink-0" />
                          <div>
                            <p className="text-xs font-light tracking-wider text-foreground">Access Granted</p>
                            <p className="text-xs text-primary tracking-widest font-mono mt-1">{generateAccessKey()}</p>
                          </div>
                        </div>
                      )}
                      {item.type === 'physical' && (
                        <div className="bg-primary/10 border border-primary/30 p-3 flex items-center gap-3">
                          <FiTruck size={16} className="text-primary flex-shrink-0" />
                          <div>
                            <p className="text-xs font-light tracking-wider text-foreground">Shipping in 3-5 business days</p>
                            <p className="text-xs text-muted-foreground font-light mt-1">Tracking info will be sent to {checkoutForm.email}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {fulfillmentLoading && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-light tracking-wider justify-center">
                    <FiLoader size={14} className="animate-spin" /> Generating confirmation email...
                  </div>
                )}

                {fulfillmentResult && (
                  <div className="border border-border p-4 bg-secondary/20 space-y-2">
                    <p className="text-xs tracking-widest text-muted-foreground font-light">EMAIL CONFIRMATION PREVIEW</p>
                    <p className="text-sm font-light text-foreground">{fulfillmentResult?.email_subject ?? ''}</p>
                    <div className="text-xs text-muted-foreground font-light leading-relaxed max-h-32 overflow-auto">
                      {renderMarkdown(fulfillmentResult?.email_body_preview ?? '')}
                    </div>
                  </div>
                )}

                <div className="flex justify-between text-sm font-normal pt-2 border-t border-border">
                  <span className="text-foreground tracking-widest">TOTAL PAID</span>
                  <span className="text-primary">{subtotal === 0 ? 'FREE' : `$${subtotal.toFixed(2)}`}</span>
                </div>

                <Button className="w-full tracking-widest font-light" onClick={handleFinish}>
                  CONTINUE SHOPPING
                </Button>
              </div>
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  )
}

function ProductCard({ product, onAddToCart, onView }: { product: SampleProduct; onAddToCart: (p: SampleProduct) => void; onView: (p: SampleProduct) => void }) {
  const typeIcon = product.type === 'digital' ? <FiDownload size={14} /> : product.type === 'ai-agent' ? <FiCpu size={14} /> : <FiTruck size={14} />
  const isFree = product.price === 0
  const buttonLabel = isFree ? 'GET FREE' : product.type === 'ai-agent' ? 'GET AGENT' : 'ADD TO CART'
  return (
    <Card className="bg-card border-border hover:border-primary/40 transition-all group cursor-pointer overflow-hidden" onClick={() => onView(product)}>
      <div className="aspect-video bg-secondary/50 relative overflow-hidden">
        {product.image ? (
          <img src={product.image} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground group-hover:text-primary transition-colors">
            {product.type === 'digital' ? <FiBook size={32} /> : product.type === 'ai-agent' ? <FiCpu size={32} /> : <FiPackage size={32} />}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {isFree && (
          <div className="absolute top-2 left-2 z-10">
            <Badge className="bg-green-600 text-white border-green-600 text-xs font-light tracking-widest flex items-center gap-1"><FiGift size={10} /> FREE</Badge>
          </div>
        )}
      </div>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs font-light tracking-wider">{product.category}</Badge>
          <span className="text-muted-foreground">{typeIcon}</span>
        </div>
        <h3 className="text-sm font-normal tracking-wider text-foreground leading-relaxed">{product.title}</h3>
        <p className="text-xs text-muted-foreground font-light leading-relaxed line-clamp-2">{product.description}</p>
        <div className="flex items-center justify-between pt-2">
          {isFree ? (
            <span className="text-green-500 font-normal text-lg tracking-widest">FREE</span>
          ) : (
            <span className="text-primary font-normal text-lg">${product.price.toFixed(2)}</span>
          )}
          <Button size="sm" className={`text-xs tracking-widest font-light ${isFree ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`} onClick={(e) => { e.stopPropagation(); onAddToCart(product) }}>
            {buttonLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function ProductDetailModal({ product, open, onClose, onAddToCart }: { product: SampleProduct | null; open: boolean; onClose: () => void; onAddToCart: (p: SampleProduct) => void }) {
  if (!product) return null
  const isFree = product.price === 0
  const buttonLabel = isFree ? 'GET FREE' : product.type === 'ai-agent' ? 'GET AGENT' : 'ADD TO CART'
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-normal tracking-widest">{product.title}</DialogTitle>
          <DialogDescription className="text-muted-foreground font-light tracking-wider">{product.category}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="aspect-video bg-secondary/50 overflow-hidden relative">
            {product.image ? (
              <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
            ) : (
              <div className="flex items-center justify-center h-full">
                {product.type === 'digital' ? <FiBook size={48} className="text-muted-foreground" /> : product.type === 'ai-agent' ? <FiCpu size={48} className="text-muted-foreground" /> : <FiPackage size={48} className="text-muted-foreground" />}
              </div>
            )}
            {isFree && (
              <div className="absolute top-2 left-2">
                <Badge className="bg-green-600 text-white border-green-600 text-xs font-light tracking-widest flex items-center gap-1"><FiGift size={10} /> FREE</Badge>
              </div>
            )}
          </div>
          <p className="text-sm text-foreground font-light leading-relaxed">{product.description}</p>
          {isFree && (
            <div className="bg-green-600/10 border border-green-600/30 p-3">
              <p className="text-xs text-green-500 font-light tracking-wider flex items-center gap-2"><FiGift size={14} /> No payment required. Instant delivery after checkout.</p>
            </div>
          )}
          {Array.isArray(product?.tags) && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag, i) => <Badge key={i} variant="outline" className="text-xs font-light tracking-wider">{tag}</Badge>)}
            </div>
          )}
          {product.type === 'physical' && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-light">
              <FiTruck size={14} /> <span>{isFree ? 'Ships free' : 'Free shipping on orders over $50'}</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            {isFree ? (
              <span className="text-green-500 text-2xl font-normal tracking-widest">FREE</span>
            ) : (
              <span className="text-primary text-2xl font-normal">${product.price.toFixed(2)}</span>
            )}
            <Button className={`tracking-widest font-light ${isFree ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`} onClick={() => { onAddToCart(product); onClose() }}>
              {buttonLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function FilterPills({ categories, active, onSelect }: { categories: string[]; active: string; onSelect: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {categories.map(cat => (
        <button key={cat} onClick={() => onSelect(cat)} className={`px-4 py-2 text-xs tracking-widest font-light border transition-colors ${active === cat ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'}`}>
          {cat.toUpperCase()}
        </button>
      ))}
    </div>
  )
}

function HeroSection({ onExplore }: { onExplore: () => void }) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-background" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 text-center">
        <p className="text-primary text-xs tracking-widest font-light mb-4 uppercase">Welcome to SEDAQUI</p>
        <h1 className="text-4xl md:text-6xl font-light tracking-widest text-foreground font-serif leading-tight mb-6">THE FUTURE OF<br />DIGITAL COMMERCE</h1>
        <p className="text-muted-foreground font-light text-sm md:text-base max-w-2xl mx-auto leading-relaxed tracking-wider mb-8">Discover curated digital products, trending physical goods, and personal AI agents -- all in one luxury marketplace.</p>
        <Button size="lg" className="tracking-widest font-light text-sm px-8 py-6" onClick={onExplore}>
          EXPLORE NOW <FiArrowRight className="ml-2" size={16} />
        </Button>
      </div>
    </section>
  )
}

function StorefrontCards({ setCurrentPage }: { setCurrentPage: (p: string) => void }) {
  const stores = [
    { key: 'digital', title: 'DIGITAL HUB', desc: 'E-books, courses, SaaS tools, and apps for the digital-first creator.', image: ASSETS.digitalHub },
    { key: 'shop', title: 'SMART SHOP', desc: 'Trending physical products curated for quality and value.', image: ASSETS.smartShop },
    { key: 'agents', title: 'AI AGENT STORE', desc: 'Personal AI agents priced $5-$25 to automate your life.', image: ASSETS.aiAgents },
  ]
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <p className="text-center text-xs tracking-widest text-muted-foreground font-light mb-2 uppercase">Our Storefronts</p>
      <h2 className="text-center text-2xl md:text-3xl font-light tracking-widest text-foreground font-serif mb-12">THREE WORLDS, ONE PLATFORM</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stores.map(store => (
          <Card key={store.key} className="bg-card border-border hover:border-primary/40 transition-all overflow-hidden group cursor-pointer" onClick={() => setCurrentPage(store.key)}>
            <div className="aspect-video overflow-hidden">
              <img src={store.image} alt={store.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <CardContent className="p-6 space-y-3">
              <h3 className="text-sm font-normal tracking-widest text-foreground">{store.title}</h3>
              <p className="text-xs text-muted-foreground font-light leading-relaxed">{store.desc}</p>
              <Button variant="outline" size="sm" className="tracking-widest font-light text-xs border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground">
                BROWSE <FiChevronRight className="ml-1" size={14} />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

function FeaturedCarousel({ products, onAddToCart, onView }: { products: SampleProduct[]; onAddToCart: (p: SampleProduct) => void; onView: (p: SampleProduct) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollDir = (dir: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * 300, behavior: 'smooth' })
    }
  }
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs tracking-widest text-muted-foreground font-light mb-1 uppercase">Curated Selection</p>
          <h2 className="text-xl font-light tracking-widest text-foreground font-serif">FEATURED PRODUCTS</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={() => scrollDir(-1)} className="p-2 border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"><FiChevronLeft size={18} /></button>
          <button onClick={() => scrollDir(1)} className="p-2 border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"><FiChevronRight size={18} /></button>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none' }}>
        {products.map(product => (
          <div key={product.id} className="min-w-[280px] max-w-[280px] flex-shrink-0">
            <ProductCard product={product} onAddToCart={onAddToCart} onView={onView} />
          </div>
        ))}
      </div>
    </section>
  )
}

function TrustBar() {
  const items = [
    { icon: FiShield, label: 'Secure Payments' },
    { icon: FiAward, label: 'Quality Guarantee' },
    { icon: FiZap, label: 'Instant Delivery' },
    { icon: FiHeart, label: '100% Satisfaction' },
  ]
  return (
    <section className="border-t border-b border-border bg-secondary/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-3 justify-center">
              <item.icon size={20} className="text-primary" />
              <span className="text-xs tracking-widest text-muted-foreground font-light">{item.label.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FooterSection({ setCurrentPage }: { setCurrentPage: (p: string) => void }) {
  return (
    <footer className="border-t border-primary/30 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src={ASSETS.logo} alt="SEDAQUI" className="h-8 w-8 object-contain" />
              <span className="text-base font-normal tracking-widest text-primary font-serif">SEDAQUI</span>
            </div>
            <p className="text-xs text-muted-foreground font-light leading-relaxed">The future of digital commerce. Curated products, AI-powered experiences.</p>
          </div>
          <div>
            <h4 className="text-xs tracking-widest text-foreground font-normal mb-4">QUICK LINKS</h4>
            <div className="space-y-2">
              {[{ key: 'home', label: 'Home' }, { key: 'digital', label: 'Digital Hub' }, { key: 'shop', label: 'Smart Shop' }, { key: 'agents', label: 'AI Agent Store' }].map(link => (
                <button key={link.key} onClick={() => setCurrentPage(link.key)} className="block text-xs text-muted-foreground font-light tracking-wider hover:text-primary transition-colors">{link.label}</button>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs tracking-widest text-foreground font-normal mb-4">POLICIES</h4>
            <div className="space-y-2">
              {[{ key: 'faq', label: 'FAQ' }, { key: 'privacy', label: 'Privacy Policy' }, { key: 'terms', label: 'Terms & Conditions' }, { key: 'refund', label: 'Refund Policy' }].map(link => (
                <button key={link.key} onClick={() => setCurrentPage(link.key)} className="block text-xs text-muted-foreground font-light tracking-wider hover:text-primary transition-colors">{link.label}</button>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs tracking-widest text-foreground font-normal mb-4">CONTACT</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-light">
                <FiMail size={14} /> <span>sedaqui@gmail.com</span>
              </div>
            </div>
          </div>
        </div>
        <Separator className="my-8 bg-border" />
        <p className="text-center text-xs text-muted-foreground font-light tracking-widest">SEDAQUI. All rights reserved.</p>
      </div>
    </footer>
  )
}

// === PAGE COMPONENTS ===

function HomePage({ setCurrentPage, onAddToCart, onView, showSample }: { setCurrentPage: (p: string) => void; onAddToCart: (p: SampleProduct) => void; onView: (p: SampleProduct) => void; showSample: boolean }) {
  const featured = showSample ? [...SAMPLE_DIGITAL_PRODUCTS.slice(0, 2), ...SAMPLE_PHYSICAL_PRODUCTS.slice(0, 2), ...SAMPLE_AI_AGENTS.slice(0, 2)] : []
  return (
    <div>
      <HeroSection onExplore={() => setCurrentPage('digital')} />
      <StorefrontCards setCurrentPage={setCurrentPage} />
      {featured.length > 0 && <FeaturedCarousel products={featured} onAddToCart={onAddToCart} onView={onView} />}
      <TrustBar />
    </div>
  )
}

function DigitalHubPage({ onAddToCart, onView, showSample }: { onAddToCart: (p: SampleProduct) => void; onView: (p: SampleProduct) => void; showSample: boolean }) {
  const [filter, setFilter] = useState('All')
  const categories = ['All', 'E-books', 'Courses', 'Apps', 'SaaS Tools']
  const products = showSample ? SAMPLE_DIGITAL_PRODUCTS.filter(p => filter === 'All' || p.category === filter) : []
  return (
    <div>
      <div className="relative h-48 md:h-64 overflow-hidden">
        <img src={ASSETS.digitalHub} alt="Digital Hub" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <h1 className="text-2xl md:text-4xl font-light tracking-widest text-foreground font-serif">DIGITAL HUB</h1>
          <p className="text-xs text-muted-foreground font-light tracking-wider mt-2">E-books, courses, apps, and SaaS tools</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FilterPills categories={categories} active={filter} onSelect={setFilter} />
        {products.length === 0 ? (
          <div className="text-center py-16">
            <FiBook size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-sm font-light tracking-widest">Enable sample data to browse products</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(p => <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} onView={onView} />)}
          </div>
        )}
      </div>
    </div>
  )
}

function SmartShopPage({ onAddToCart, onView, showSample }: { onAddToCart: (p: SampleProduct) => void; onView: (p: SampleProduct) => void; showSample: boolean }) {
  const [filter, setFilter] = useState('All')
  const categories = ['All', 'Electronics', 'Fashion', 'Home', 'Fitness']
  const products = showSample ? SAMPLE_PHYSICAL_PRODUCTS.filter(p => filter === 'All' || p.category === filter) : []
  return (
    <div>
      <div className="relative h-48 md:h-64 overflow-hidden">
        <img src={ASSETS.smartShop} alt="Smart Shop" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <h1 className="text-2xl md:text-4xl font-light tracking-widest text-foreground font-serif">SMART SHOP</h1>
          <p className="text-xs text-muted-foreground font-light tracking-wider mt-2">Trending physical products curated for you</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FilterPills categories={categories} active={filter} onSelect={setFilter} />
        {products.length === 0 ? (
          <div className="text-center py-16">
            <FiPackage size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-sm font-light tracking-widest">Enable sample data to browse products</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(p => (
              <div key={p.id} className="relative">
                <ProductCard product={p} onAddToCart={onAddToCart} onView={onView} />
                <div className="absolute top-2 right-2 z-10">
                  <Badge variant="secondary" className="text-xs font-light tracking-wider flex items-center gap-1"><FiTruck size={10} /> Ships Free</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function AIAgentStorePage({ onAddToCart, onView, showSample }: { onAddToCart: (p: SampleProduct) => void; onView: (p: SampleProduct) => void; showSample: boolean }) {
  const [filter, setFilter] = useState('All')
  const categories = ['All', 'Fitness', 'Language', 'Cooking', 'Business', 'Study', 'Productivity']
  const products = showSample ? SAMPLE_AI_AGENTS.filter(p => filter === 'All' || p.category === filter) : []
  return (
    <div>
      <div className="relative h-48 md:h-64 overflow-hidden">
        <img src={ASSETS.aiAgents} alt="AI Agent Store" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <h1 className="text-2xl md:text-4xl font-light tracking-widest text-foreground font-serif">AI AGENT STORE</h1>
          <p className="text-xs text-muted-foreground font-light tracking-wider mt-2">Personal AI agents from $5 to $25</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FilterPills categories={categories} active={filter} onSelect={setFilter} />
        {products.length === 0 ? (
          <div className="text-center py-16">
            <FiCpu size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-sm font-light tracking-widest">Enable sample data to browse agents</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(p => <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} onView={onView} />)}
          </div>
        )}
      </div>
    </div>
  )
}

function ContactPage() {
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [contactStatus, setContactStatus] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const handleContactSubmit = () => {
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      setContactStatus('Please fill in all required fields.')
      return
    }
    setContactStatus('Message sent successfully. We will respond within 24 hours.')
    setContactForm({ name: '', email: '', subject: '', message: '' })
  }

  const handleChatSend = async () => {
    if (!chatInput.trim() || chatLoading) return
    const userMsg = chatInput.trim()
    setChatInput('')
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setChatLoading(true)
    try {
      const result = await callAIAgent(userMsg, AGENT_IDS.CUSTOMER_SUPPORT)
      const parsed = parseAgentResponse(result)
      const answer = parsed?.answer ?? parsed?.text ?? result?.response?.message ?? 'I apologize, I could not process your request at this time.'
      const followUp = parsed?.follow_up_question ?? ''
      const category = parsed?.category ?? ''
      setChatMessages(prev => [...prev, { role: 'assistant', content: answer, followUp, category }])
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'An error occurred. Please try again.' }])
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <p className="text-center text-xs tracking-widest text-muted-foreground font-light mb-2 uppercase">Get In Touch</p>
      <h1 className="text-center text-2xl md:text-3xl font-light tracking-widest text-foreground font-serif mb-12">CONTACT US</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-normal tracking-widest">SEND A MESSAGE</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs tracking-widest font-light">NAME *</Label>
              <Input value={contactForm.name} onChange={e => setContactForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Your full name" className="mt-1 bg-secondary/30 border-border" />
            </div>
            <div>
              <Label className="text-xs tracking-widest font-light">EMAIL *</Label>
              <Input type="email" value={contactForm.email} onChange={e => setContactForm(prev => ({ ...prev, email: e.target.value }))} placeholder="your@email.com" className="mt-1 bg-secondary/30 border-border" />
            </div>
            <div>
              <Label className="text-xs tracking-widest font-light">SUBJECT</Label>
              <Input value={contactForm.subject} onChange={e => setContactForm(prev => ({ ...prev, subject: e.target.value }))} placeholder="Message subject" className="mt-1 bg-secondary/30 border-border" />
            </div>
            <div>
              <Label className="text-xs tracking-widest font-light">MESSAGE *</Label>
              <Textarea value={contactForm.message} onChange={e => setContactForm(prev => ({ ...prev, message: e.target.value }))} placeholder="How can we help?" rows={4} className="mt-1 bg-secondary/30 border-border" />
            </div>
            {contactStatus && <p className={`text-xs font-light tracking-wider ${contactStatus.includes('success') ? 'text-green-500' : 'text-destructive'}`}>{contactStatus}</p>}
            <Button onClick={handleContactSubmit} className="w-full tracking-widest font-light">SEND MESSAGE</Button>
            <div className="pt-4 border-t border-border space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-light"><FiMail size={14} className="text-primary" /> sedaqui@gmail.com</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border flex flex-col">
          <CardHeader>
            <CardTitle className="text-base font-normal tracking-widest flex items-center gap-2"><FiMessageSquare size={16} className="text-primary" /> AI SUPPORT CHAT</CardTitle>
            <CardDescription className="text-xs font-light tracking-wider">Ask questions about products, orders, or policies</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 min-h-[300px] max-h-[400px] mb-4 pr-2">
              <div className="space-y-3">
                {chatMessages.length === 0 && (
                  <div className="text-center py-8">
                    <FiMessageSquare size={32} className="mx-auto text-muted-foreground mb-3" />
                    <p className="text-xs text-muted-foreground font-light tracking-wider">Ask me anything about SEDAQUI</p>
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 text-sm font-light leading-relaxed ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 text-foreground border border-border'}`}>
                      {msg.role === 'assistant' ? renderMarkdown(msg.content) : msg.content}
                      {msg.followUp && (
                        <button onClick={() => setChatInput(msg.followUp ?? '')} className="block mt-2 text-xs text-primary hover:underline font-light tracking-wider">
                          {msg.followUp}
                        </button>
                      )}
                      {msg.category && <Badge variant="outline" className="mt-2 text-xs font-light">{msg.category}</Badge>}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-secondary/50 border border-border p-3 text-sm text-muted-foreground font-light flex items-center gap-2">
                      <FiLoader size={14} className="animate-spin" /> Thinking...
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </ScrollArea>
            <div className="flex gap-2">
              <Input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleChatSend()} placeholder="Type your question..." className="bg-secondary/30 border-border text-sm font-light" />
              <Button onClick={handleChatSend} disabled={chatLoading || !chatInput.trim()} size="sm" className="tracking-widest">
                <FiSend size={14} />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function AdminPanel() {
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <p className="text-center text-xs tracking-widest text-muted-foreground font-light mb-2 uppercase">Management Console</p>
      <h1 className="text-center text-2xl md:text-3xl font-light tracking-widest text-foreground font-serif mb-8">ADMIN PANEL</h1>
      <Tabs defaultValue="digital" className="space-y-6">
        <TabsList className="w-full flex flex-wrap gap-1 bg-secondary/30 p-1">
          <TabsTrigger value="digital" className="flex-1 text-xs tracking-widest font-light min-w-0">DIGITAL HUB</TabsTrigger>
          <TabsTrigger value="shop" className="flex-1 text-xs tracking-widest font-light min-w-0">SMART SHOP</TabsTrigger>
          <TabsTrigger value="agents" className="flex-1 text-xs tracking-widest font-light min-w-0">AI AGENTS</TabsTrigger>
          <TabsTrigger value="orders" className="flex-1 text-xs tracking-widest font-light min-w-0">ORDERS</TabsTrigger>
          <TabsTrigger value="kb" className="flex-1 text-xs tracking-widest font-light min-w-0">KNOWLEDGE BASE</TabsTrigger>
        </TabsList>

        <TabsContent value="digital">
          <DigitalProductGenerator setActiveAgentId={setActiveAgentId} />
        </TabsContent>
        <TabsContent value="shop">
          <SmartShopGenerator setActiveAgentId={setActiveAgentId} />
        </TabsContent>
        <TabsContent value="agents">
          <AIAgentGenerator setActiveAgentId={setActiveAgentId} />
        </TabsContent>
        <TabsContent value="orders">
          <OrderFulfillmentSection setActiveAgentId={setActiveAgentId} />
        </TabsContent>
        <TabsContent value="kb">
          <KnowledgeBaseManager />
        </TabsContent>
      </Tabs>

      <AgentStatusPanel activeAgentId={activeAgentId} />
    </div>
  )
}

function DigitalProductGenerator({ setActiveAgentId }: { setActiveAgentId: (id: string | null) => void }) {
  const [form, setForm] = useState({ name: '', category: 'E-book', notes: '' })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    if (!form.name) { setError('Product name is required.'); return }
    setError('')
    setLoading(true)
    setResult(null)
    setActiveAgentId(AGENT_IDS.DIGITAL_PRODUCT)
    try {
      const msg = `Generate a listing for: ${form.name}, Category: ${form.category}, Notes: ${form.notes || 'None'}`
      const res = await callAIAgent(msg, AGENT_IDS.DIGITAL_PRODUCT)
      const parsed = parseAgentResponse(res)
      setResult(parsed)
    } catch {
      setError('Failed to generate listing. Please try again.')
    } finally {
      setLoading(false)
      setActiveAgentId(null)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base font-normal tracking-widest flex items-center gap-2"><FiBook size={16} className="text-primary" /> DIGITAL HUB CONTENT GENERATOR</CardTitle>
          <CardDescription className="text-xs font-light tracking-wider">Generate optimized product listings for e-books, courses, and SaaS tools</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs tracking-widest font-light">PRODUCT NAME *</Label>
            <Input value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g., Advanced React Patterns" className="mt-1 bg-secondary/30 border-border" />
          </div>
          <div>
            <Label className="text-xs tracking-widest font-light">CATEGORY</Label>
            <select value={form.category} onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))} className="mt-1 w-full bg-secondary/30 border border-border text-foreground text-sm font-light p-2 focus:outline-none focus:ring-1 focus:ring-ring">
              <option value="E-book">E-book</option>
              <option value="Course">Course</option>
              <option value="SaaS Tool">SaaS Tool</option>
              <option value="App">App</option>
            </select>
          </div>
          <div>
            <Label className="text-xs tracking-widest font-light">NOTES</Label>
            <Textarea value={form.notes} onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))} placeholder="Additional details, target audience, unique features..." rows={3} className="mt-1 bg-secondary/30 border-border" />
          </div>
          {error && <p className="text-xs text-destructive font-light flex items-center gap-1"><FiAlertCircle size={12} /> {error}</p>}
          <Button onClick={handleGenerate} disabled={loading} className="w-full tracking-widest font-light">
            {loading ? <><FiLoader size={14} className="mr-2 animate-spin" /> GENERATING...</> : 'GENERATE LISTING'}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base font-normal tracking-widest">GENERATED LISTING</CardTitle>
        </CardHeader>
        <CardContent>
          {!result && !loading && (
            <div className="text-center py-12">
              <FiFileText size={40} className="mx-auto text-muted-foreground mb-3" />
              <p className="text-xs text-muted-foreground font-light tracking-wider">Results will appear here</p>
            </div>
          )}
          {loading && (
            <div className="space-y-3">
              <div className="h-6 bg-muted animate-pulse w-3/4" />
              <div className="h-4 bg-muted animate-pulse w-full" />
              <div className="h-4 bg-muted animate-pulse w-5/6" />
              <div className="h-4 bg-muted animate-pulse w-2/3" />
            </div>
          )}
          {result && (
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-4 pr-4">
                <div>
                  <p className="text-xs text-muted-foreground tracking-widest mb-1">TITLE</p>
                  <p className="text-sm font-normal text-foreground">{result?.product_title ?? 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground tracking-widest mb-1">TAGLINE</p>
                  <p className="text-sm font-light text-primary italic">{result?.tagline ?? 'N/A'}</p>
                </div>
                <Separator className="bg-border" />
                <div>
                  <p className="text-xs text-muted-foreground tracking-widest mb-1">DESCRIPTION</p>
                  <div className="text-sm font-light leading-relaxed text-foreground">{renderMarkdown(result?.description ?? '')}</div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground tracking-widest mb-1">FEATURES</p>
                  <ul className="space-y-1">
                    {Array.isArray(result?.features) ? result.features.map((f: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm font-light text-foreground"><FiCheck size={14} className="text-primary mt-0.5 flex-shrink-0" /> {f}</li>
                    )) : <li className="text-sm text-muted-foreground font-light">No features listed</li>}
                  </ul>
                </div>
                <div className="flex gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground tracking-widest mb-1">PRICING TIER</p>
                    <Badge className="font-light">{result?.pricing_tier ?? 'N/A'}</Badge>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground tracking-widest mb-1">PRICING REASONING</p>
                  <div className="text-sm font-light leading-relaxed text-foreground">{renderMarkdown(result?.pricing_reasoning ?? '')}</div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground tracking-widest mb-1">SEO KEYWORDS</p>
                  <div className="flex flex-wrap gap-1">
                    {Array.isArray(result?.seo_keywords) ? result.seo_keywords.map((k: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs font-light">{k}</Badge>
                    )) : <span className="text-xs text-muted-foreground font-light">None</span>}
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function SmartShopGenerator({ setActiveAgentId }: { setActiveAgentId: (id: string | null) => void }) {
  const [form, setForm] = useState({ name: '', category: 'Electronics', cost: '', details: '' })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    if (!form.name) { setError('Product name is required.'); return }
    setError('')
    setLoading(true)
    setResult(null)
    setActiveAgentId(AGENT_IDS.SMART_SHOP)
    try {
      const msg = `Optimize product listing for: ${form.name}, Category: ${form.category}, Supplier Cost: ${form.cost || 'Not provided'}, Details: ${form.details || 'None'}`
      const res = await callAIAgent(msg, AGENT_IDS.SMART_SHOP)
      const parsed = parseAgentResponse(res)
      setResult(parsed)
    } catch {
      setError('Failed to optimize product. Please try again.')
    } finally {
      setLoading(false)
      setActiveAgentId(null)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base font-normal tracking-widest flex items-center gap-2"><FiPackage size={16} className="text-primary" /> SMART SHOP PRODUCT OPTIMIZER</CardTitle>
          <CardDescription className="text-xs font-light tracking-wider">Generate SEO-optimized descriptions and pricing recommendations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs tracking-widest font-light">PRODUCT NAME *</Label>
            <Input value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g., Wireless Bluetooth Earbuds" className="mt-1 bg-secondary/30 border-border" />
          </div>
          <div>
            <Label className="text-xs tracking-widest font-light">CATEGORY</Label>
            <select value={form.category} onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))} className="mt-1 w-full bg-secondary/30 border border-border text-foreground text-sm font-light p-2 focus:outline-none focus:ring-1 focus:ring-ring">
              <option value="Electronics">Electronics</option>
              <option value="Fashion">Fashion</option>
              <option value="Home">Home</option>
              <option value="Fitness">Fitness</option>
            </select>
          </div>
          <div>
            <Label className="text-xs tracking-widest font-light">SUPPLIER COST (OPTIONAL)</Label>
            <Input value={form.cost} onChange={e => setForm(prev => ({ ...prev, cost: e.target.value }))} placeholder="e.g., $15.00" className="mt-1 bg-secondary/30 border-border" />
          </div>
          <div>
            <Label className="text-xs tracking-widest font-light">PRODUCT DETAILS</Label>
            <Textarea value={form.details} onChange={e => setForm(prev => ({ ...prev, details: e.target.value }))} placeholder="Material, features, dimensions..." rows={3} className="mt-1 bg-secondary/30 border-border" />
          </div>
          {error && <p className="text-xs text-destructive font-light flex items-center gap-1"><FiAlertCircle size={12} /> {error}</p>}
          <Button onClick={handleGenerate} disabled={loading} className="w-full tracking-widest font-light">
            {loading ? <><FiLoader size={14} className="mr-2 animate-spin" /> OPTIMIZING...</> : 'OPTIMIZE PRODUCT'}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base font-normal tracking-widest">OPTIMIZED LISTING</CardTitle>
        </CardHeader>
        <CardContent>
          {!result && !loading && (
            <div className="text-center py-12">
              <FiFileText size={40} className="mx-auto text-muted-foreground mb-3" />
              <p className="text-xs text-muted-foreground font-light tracking-wider">Results will appear here</p>
            </div>
          )}
          {loading && (
            <div className="space-y-3">
              <div className="h-6 bg-muted animate-pulse w-3/4" />
              <div className="h-4 bg-muted animate-pulse w-full" />
              <div className="h-4 bg-muted animate-pulse w-5/6" />
            </div>
          )}
          {result && (
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-4 pr-4">
                <div>
                  <p className="text-xs text-muted-foreground tracking-widest mb-1">TITLE</p>
                  <p className="text-sm font-normal text-foreground">{result?.product_title ?? 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground tracking-widest mb-1">TAGLINE</p>
                  <p className="text-sm font-light text-primary italic">{result?.tagline ?? 'N/A'}</p>
                </div>
                <Separator className="bg-border" />
                <div>
                  <p className="text-xs text-muted-foreground tracking-widest mb-1">DESCRIPTION</p>
                  <div className="text-sm font-light leading-relaxed text-foreground">{renderMarkdown(result?.description ?? '')}</div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground tracking-widest mb-1">FEATURES</p>
                  <ul className="space-y-1">
                    {Array.isArray(result?.features) ? result.features.map((f: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm font-light text-foreground"><FiCheck size={14} className="text-primary mt-0.5 flex-shrink-0" /> {f}</li>
                    )) : <li className="text-sm text-muted-foreground font-light">No features listed</li>}
                  </ul>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground tracking-widest mb-1">RECOMMENDED PRICE</p>
                  <Badge className="font-light text-base">{result?.recommended_price ?? 'N/A'}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground tracking-widest mb-1">PROFIT ANALYSIS</p>
                  <div className="text-sm font-light leading-relaxed text-foreground">{renderMarkdown(result?.profit_analysis ?? '')}</div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground tracking-widest mb-1">CATEGORY TAGS</p>
                  <div className="flex flex-wrap gap-1">
                    {Array.isArray(result?.category_tags) ? result.category_tags.map((t: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs font-light">{t}</Badge>
                    )) : <span className="text-xs text-muted-foreground font-light">None</span>}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground tracking-widest mb-1">SHIPPING NOTE</p>
                  <p className="text-sm font-light text-foreground flex items-center gap-2"><FiTruck size={14} className="text-primary" /> {result?.shipping_note ?? 'N/A'}</p>
                </div>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function AIAgentGenerator({ setActiveAgentId }: { setActiveAgentId: (id: string | null) => void }) {
  const [form, setForm] = useState({ name: '', category: 'Fitness', notes: '' })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    if (!form.name) { setError('Agent name is required.'); return }
    setError('')
    setLoading(true)
    setResult(null)
    setActiveAgentId(AGENT_IDS.AI_STOREFRONT)
    try {
      const msg = `Generate an AI agent listing for: ${form.name}, Category: ${form.category}, Capabilities: ${form.notes || 'General purpose'}`
      const res = await callAIAgent(msg, AGENT_IDS.AI_STOREFRONT)
      const parsed = parseAgentResponse(res)
      setResult(parsed)
    } catch {
      setError('Failed to generate listing. Please try again.')
    } finally {
      setLoading(false)
      setActiveAgentId(null)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base font-normal tracking-widest flex items-center gap-2"><FiCpu size={16} className="text-primary" /> AI AGENT LISTING GENERATOR</CardTitle>
          <CardDescription className="text-xs font-light tracking-wider">Create compelling product pages for AI agents</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs tracking-widest font-light">AGENT NAME *</Label>
            <Input value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g., FitCoach AI" className="mt-1 bg-secondary/30 border-border" />
          </div>
          <div>
            <Label className="text-xs tracking-widest font-light">CATEGORY</Label>
            <select value={form.category} onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))} className="mt-1 w-full bg-secondary/30 border border-border text-foreground text-sm font-light p-2 focus:outline-none focus:ring-1 focus:ring-ring">
              <option value="Fitness">Fitness</option>
              <option value="Language">Language</option>
              <option value="Cooking">Cooking</option>
              <option value="Business">Business</option>
              <option value="Study">Study</option>
              <option value="Productivity">Productivity</option>
            </select>
          </div>
          <div>
            <Label className="text-xs tracking-widest font-light">CAPABILITY NOTES</Label>
            <Textarea value={form.notes} onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))} placeholder="What can this agent do? Key features and differentiators..." rows={3} className="mt-1 bg-secondary/30 border-border" />
          </div>
          {error && <p className="text-xs text-destructive font-light flex items-center gap-1"><FiAlertCircle size={12} /> {error}</p>}
          <Button onClick={handleGenerate} disabled={loading} className="w-full tracking-widest font-light">
            {loading ? <><FiLoader size={14} className="mr-2 animate-spin" /> GENERATING...</> : 'GENERATE AGENT LISTING'}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base font-normal tracking-widest">GENERATED AGENT LISTING</CardTitle>
        </CardHeader>
        <CardContent>
          {!result && !loading && (
            <div className="text-center py-12">
              <FiFileText size={40} className="mx-auto text-muted-foreground mb-3" />
              <p className="text-xs text-muted-foreground font-light tracking-wider">Results will appear here</p>
            </div>
          )}
          {loading && (
            <div className="space-y-3">
              <div className="h-6 bg-muted animate-pulse w-3/4" />
              <div className="h-4 bg-muted animate-pulse w-full" />
              <div className="h-4 bg-muted animate-pulse w-5/6" />
            </div>
          )}
          {result && (
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-4 pr-4">
                <div>
                  <p className="text-xs text-muted-foreground tracking-widest mb-1">AGENT TITLE</p>
                  <p className="text-sm font-normal text-foreground">{result?.agent_title ?? 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground tracking-widest mb-1">TAGLINE</p>
                  <p className="text-sm font-light text-primary italic">{result?.tagline ?? 'N/A'}</p>
                </div>
                <Separator className="bg-border" />
                <div>
                  <p className="text-xs text-muted-foreground tracking-widest mb-1">DESCRIPTION</p>
                  <div className="text-sm font-light leading-relaxed text-foreground">{renderMarkdown(result?.description ?? '')}</div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground tracking-widest mb-1">CAPABILITIES</p>
                  <ul className="space-y-1">
                    {Array.isArray(result?.capabilities) ? result.capabilities.map((c: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm font-light text-foreground"><FiZap size={14} className="text-primary mt-0.5 flex-shrink-0" /> {c}</li>
                    )) : <li className="text-sm text-muted-foreground font-light">No capabilities listed</li>}
                  </ul>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground tracking-widest mb-1">SUGGESTED PRICE</p>
                  <Badge className="font-light text-base">{result?.suggested_price ?? 'N/A'}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground tracking-widest mb-1">PRICE JUSTIFICATION</p>
                  <div className="text-sm font-light leading-relaxed text-foreground">{renderMarkdown(result?.price_justification ?? '')}</div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground tracking-widest mb-1">UPSELL RECOMMENDATION</p>
                  <div className="text-sm font-light leading-relaxed text-foreground">{renderMarkdown(result?.upsell_recommendation ?? '')}</div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground tracking-widest mb-1">USE CASES</p>
                  <ul className="space-y-1">
                    {Array.isArray(result?.use_cases) ? result.use_cases.map((u: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm font-light text-foreground"><FiArrowRight size={14} className="text-primary mt-0.5 flex-shrink-0" /> {u}</li>
                    )) : <li className="text-sm text-muted-foreground font-light">No use cases listed</li>}
                  </ul>
                </div>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function OrderFulfillmentSection({ setActiveAgentId }: { setActiveAgentId: (id: string | null) => void }) {
  const [form, setForm] = useState({ customerName: '', customerEmail: '', orderNumber: '', products: '', orderType: 'Digital' })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [statusMsg, setStatusMsg] = useState('')

  const handleSend = async () => {
    if (!form.customerName || !form.customerEmail || !form.orderNumber || !form.products) {
      setError('All fields are required except order type.')
      return
    }
    setError('')
    setStatusMsg('')
    setLoading(true)
    setResult(null)
    setActiveAgentId(AGENT_IDS.ORDER_FULFILLMENT)
    try {
      const msg = `Send order confirmation to ${form.customerName} at ${form.customerEmail}. Order #${form.orderNumber}. Products: ${form.products}. Order type: ${form.orderType}.`
      const res = await callAIAgent(msg, AGENT_IDS.ORDER_FULFILLMENT)
      const parsed = parseAgentResponse(res)
      setResult(parsed)
      setStatusMsg('Order confirmation processed successfully.')
    } catch {
      setError('Failed to process order confirmation. Please try again.')
    } finally {
      setLoading(false)
      setActiveAgentId(null)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base font-normal tracking-widest flex items-center gap-2"><FiMail size={16} className="text-primary" /> ORDER FULFILLMENT</CardTitle>
          <CardDescription className="text-xs font-light tracking-wider">Send order confirmation emails via Gmail</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs tracking-widest font-light">CUSTOMER NAME *</Label>
            <Input value={form.customerName} onChange={e => setForm(prev => ({ ...prev, customerName: e.target.value }))} placeholder="John Smith" className="mt-1 bg-secondary/30 border-border" />
          </div>
          <div>
            <Label className="text-xs tracking-widest font-light">CUSTOMER EMAIL *</Label>
            <Input type="email" value={form.customerEmail} onChange={e => setForm(prev => ({ ...prev, customerEmail: e.target.value }))} placeholder="john@example.com" className="mt-1 bg-secondary/30 border-border" />
          </div>
          <div>
            <Label className="text-xs tracking-widest font-light">ORDER NUMBER *</Label>
            <Input value={form.orderNumber} onChange={e => setForm(prev => ({ ...prev, orderNumber: e.target.value }))} placeholder="ORD-2024-001" className="mt-1 bg-secondary/30 border-border" />
          </div>
          <div>
            <Label className="text-xs tracking-widest font-light">PRODUCTS PURCHASED *</Label>
            <Textarea value={form.products} onChange={e => setForm(prev => ({ ...prev, products: e.target.value }))} placeholder="List of products purchased..." rows={3} className="mt-1 bg-secondary/30 border-border" />
          </div>
          <div>
            <Label className="text-xs tracking-widest font-light">ORDER TYPE</Label>
            <select value={form.orderType} onChange={e => setForm(prev => ({ ...prev, orderType: e.target.value }))} className="mt-1 w-full bg-secondary/30 border border-border text-foreground text-sm font-light p-2 focus:outline-none focus:ring-1 focus:ring-ring">
              <option value="Digital">Digital</option>
              <option value="Physical">Physical</option>
              <option value="AI Agent">AI Agent</option>
            </select>
          </div>
          {error && <p className="text-xs text-destructive font-light flex items-center gap-1"><FiAlertCircle size={12} /> {error}</p>}
          {statusMsg && <p className="text-xs text-green-500 font-light flex items-center gap-1"><FiCheck size={12} /> {statusMsg}</p>}
          <Button onClick={handleSend} disabled={loading || !form.customerName || !form.customerEmail || !form.orderNumber || !form.products} className="w-full tracking-widest font-light">
            {loading ? <><FiLoader size={14} className="mr-2 animate-spin" /> SENDING...</> : 'SEND CONFIRMATION'}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base font-normal tracking-widest">EMAIL PREVIEW</CardTitle>
        </CardHeader>
        <CardContent>
          {!result && !loading && (
            <div className="text-center py-12">
              <FiMail size={40} className="mx-auto text-muted-foreground mb-3" />
              <p className="text-xs text-muted-foreground font-light tracking-wider">Email preview will appear here</p>
            </div>
          )}
          {loading && (
            <div className="space-y-3">
              <div className="h-6 bg-muted animate-pulse w-3/4" />
              <div className="h-4 bg-muted animate-pulse w-full" />
              <div className="h-4 bg-muted animate-pulse w-5/6" />
            </div>
          )}
          {result && (
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-4 pr-4">
                <div>
                  <p className="text-xs text-muted-foreground tracking-widest mb-1">SUBJECT</p>
                  <p className="text-sm font-normal text-foreground">{result?.email_subject ?? 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground tracking-widest mb-1">STATUS</p>
                  <Badge className="font-light">{result?.status ?? 'N/A'}</Badge>
                </div>
                <Separator className="bg-border" />
                <div>
                  <p className="text-xs text-muted-foreground tracking-widest mb-1">EMAIL BODY PREVIEW</p>
                  <div className="bg-secondary/20 border border-border p-4">
                    <div className="text-sm font-light leading-relaxed text-foreground">{renderMarkdown(result?.email_body_preview ?? '')}</div>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground tracking-widest mb-1">UPSELL PRODUCTS</p>
                  <ul className="space-y-1">
                    {Array.isArray(result?.upsell_products) ? result.upsell_products.map((p: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm font-light text-foreground"><FiTag size={14} className="text-primary mt-0.5 flex-shrink-0" /> {p}</li>
                    )) : <li className="text-sm text-muted-foreground font-light">No upsell suggestions</li>}
                  </ul>
                </div>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function KnowledgeBaseManager() {
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const [crawlUrl, setCrawlUrl] = useState('')
  const [crawlStatus, setCrawlStatus] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchDocs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getDocuments(RAG_ID)
      if (res.success && Array.isArray(res?.documents)) {
        setDocuments(res.documents)
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadStatus('Uploading and training...')
    try {
      const res = await uploadAndTrainDocument(RAG_ID, file)
      if (res.success) {
        setUploadStatus('Document uploaded and trained successfully.')
        await fetchDocs()
      } else {
        setUploadStatus(res?.error ?? 'Upload failed.')
      }
    } catch {
      setUploadStatus('Upload failed. Please try again.')
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDelete = async (fileName: string) => {
    if (!fileName) return
    try {
      const res = await deleteDocuments(RAG_ID, [fileName])
      if (res.success) {
        setDocuments(prev => prev.filter(d => d?.fileName !== fileName))
      }
    } catch {
      // silently handle
    }
  }

  const handleCrawl = async () => {
    if (!crawlUrl.trim()) return
    setCrawlStatus('Crawling...')
    try {
      const res = await crawlWebsite(RAG_ID, crawlUrl.trim())
      if (res.success) {
        setCrawlStatus('Website crawled successfully.')
        setCrawlUrl('')
        await fetchDocs()
      } else {
        setCrawlStatus(res?.error ?? 'Crawl failed.')
      }
    } catch {
      setCrawlStatus('Crawl failed. Please try again.')
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base font-normal tracking-widest flex items-center gap-2"><FiDatabase size={16} className="text-primary" /> KNOWLEDGE BASE</CardTitle>
          <CardDescription className="text-xs font-light tracking-wider">Manage the Customer Support Agent knowledge base</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs tracking-widest font-light">UPLOAD DOCUMENT</Label>
            <p className="text-xs text-muted-foreground font-light mb-2">Supported: PDF, DOCX, TXT</p>
            <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" onChange={handleUpload} className="hidden" />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full tracking-widest font-light border-border">
              <FiUpload size={14} className="mr-2" /> CHOOSE FILE
            </Button>
            {uploadStatus && <p className={`text-xs font-light mt-2 ${uploadStatus.includes('success') ? 'text-green-500' : uploadStatus.includes('Uploading') ? 'text-primary' : 'text-destructive'}`}>{uploadStatus}</p>}
          </div>
          <Separator className="bg-border" />
          <div>
            <Label className="text-xs tracking-widest font-light">CRAWL WEBSITE</Label>
            <div className="flex gap-2 mt-1">
              <Input value={crawlUrl} onChange={e => setCrawlUrl(e.target.value)} placeholder="https://example.com" className="bg-secondary/30 border-border" />
              <Button onClick={handleCrawl} disabled={!crawlUrl.trim()} size="sm" className="tracking-widest font-light"><FiGlobe size={14} /></Button>
            </div>
            {crawlStatus && <p className={`text-xs font-light mt-2 ${crawlStatus.includes('success') ? 'text-green-500' : crawlStatus.includes('Crawling') ? 'text-primary' : 'text-destructive'}`}>{crawlStatus}</p>}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-normal tracking-widest">DOCUMENTS</CardTitle>
            <Button variant="ghost" size="sm" onClick={fetchDocs} className="text-xs"><FiRefreshCw size={14} /></Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <div className="h-10 bg-muted animate-pulse" />
              <div className="h-10 bg-muted animate-pulse" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <FiFileText size={40} className="mx-auto text-muted-foreground mb-3" />
              <p className="text-xs text-muted-foreground font-light tracking-wider">No documents uploaded yet</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-2">
                {documents.map((doc, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border border-border bg-secondary/20">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FiFileText size={16} className="text-primary flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-light text-foreground truncate">{doc?.fileName ?? 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground font-light">{doc?.fileType ?? ''}{doc?.status ? ` - ${doc.status}` : ''}</p>
                      </div>
                    </div>
                    <button onClick={() => handleDelete(doc?.fileName ?? '')} className="p-1 text-muted-foreground hover:text-destructive flex-shrink-0"><FiTrash2 size={14} /></button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function AgentStatusPanel({ activeAgentId }: { activeAgentId: string | null }) {
  const agents = [
    { id: AGENT_IDS.DIGITAL_PRODUCT, name: 'Digital Product Content Agent', purpose: 'Generates product listings for the Digital Hub' },
    { id: AGENT_IDS.SMART_SHOP, name: 'Smart Shop Product Agent', purpose: 'Optimizes physical product descriptions and pricing' },
    { id: AGENT_IDS.AI_STOREFRONT, name: 'AI Agent Storefront Agent', purpose: 'Creates AI agent product pages and pricing' },
    { id: AGENT_IDS.CUSTOMER_SUPPORT, name: 'Customer Support Agent', purpose: 'Answers customer questions via chat' },
    { id: AGENT_IDS.ORDER_FULFILLMENT, name: 'Order Fulfillment Agent', purpose: 'Sends order confirmation emails via Gmail' },
  ]
  return (
    <Card className="bg-card border-border mt-8">
      <CardHeader>
        <CardTitle className="text-sm font-normal tracking-widest flex items-center gap-2"><FiLayers size={14} className="text-primary" /> PLATFORM AGENTS</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {agents.map(agent => (
            <div key={agent.id} className={`p-3 border transition-colors ${activeAgentId === agent.id ? 'border-primary bg-primary/5' : 'border-border bg-secondary/10'}`}>
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2 h-2 ${activeAgentId === agent.id ? 'bg-primary animate-pulse' : 'bg-muted-foreground/30'}`} />
                <span className="text-xs font-normal tracking-wider text-foreground">{agent.name}</span>
              </div>
              <p className="text-xs text-muted-foreground font-light leading-relaxed">{agent.purpose}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function FAQPage({ setCurrentPage }: { setCurrentPage: (p: string) => void }) {
  const faqs = [
    { q: 'What types of products does SEDAQUI offer?', a: 'SEDAQUI offers three categories: digital products (e-books, courses, SaaS tools, and apps), physical products (electronics, fashion, home, and fitness items), and personal AI agents ($5-$25) for various tasks like fitness coaching, language learning, cooking assistance, and business strategy.' },
    { q: 'How do I receive digital products?', a: 'Digital products are delivered instantly via email after purchase. You will receive a download link or access credentials depending on the product type. SaaS tools and apps may require account creation.' },
    { q: 'What is the shipping policy for physical products?', a: 'Physical products ship within 2-5 business days. Orders over $50 qualify for free shipping. International shipping is available with varying delivery times. You will receive tracking information via email once your order ships.' },
    { q: 'How do AI agents work?', a: 'AI agents are personal assistants powered by artificial intelligence. After purchase, you receive access to your agent through our platform. Each agent specializes in a specific area and learns from your interactions to provide increasingly personalized assistance.' },
    { q: 'What is your refund policy?', a: 'We offer a 30-day satisfaction guarantee on all products. Digital products can be refunded if you have not consumed more than 25% of the content. Physical products must be returned in original condition. AI agents can be refunded within 7 days of purchase.' },
    { q: 'How do I contact customer support?', a: 'You can reach us through the AI chat support on our Contact page for instant answers, or send a message through the contact form. Email us directly at sedaqui@gmail.com for complex inquiries. We respond within 24 hours.' },
  ]
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <button onClick={() => setCurrentPage('home')} className="text-xs text-muted-foreground tracking-widest font-light mb-6 flex items-center gap-1 hover:text-primary transition-colors"><FiChevronLeft size={14} /> BACK TO HOME</button>
      <h1 className="text-2xl md:text-3xl font-light tracking-widest text-foreground font-serif mb-8">FREQUENTLY ASKED QUESTIONS</h1>
      <Accordion type="single" collapsible className="space-y-2">
        {faqs.map((faq, i) => (
          <AccordionItem key={i} value={`faq-${i}`} className="border border-border bg-card px-4">
            <AccordionTrigger className="text-sm font-light tracking-wider text-foreground hover:text-primary">{faq.q}</AccordionTrigger>
            <AccordionContent className="text-sm font-light text-muted-foreground leading-relaxed">{faq.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}

function ContentPolicyPage({ title, setCurrentPage, children }: { title: string; setCurrentPage: (p: string) => void; children: React.ReactNode }) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <button onClick={() => setCurrentPage('home')} className="text-xs text-muted-foreground tracking-widest font-light mb-6 flex items-center gap-1 hover:text-primary transition-colors"><FiChevronLeft size={14} /> BACK TO HOME</button>
      <h1 className="text-2xl md:text-3xl font-light tracking-widest text-foreground font-serif mb-8">{title}</h1>
      <div className="space-y-6 text-sm font-light text-foreground leading-relaxed">{children}</div>
    </div>
  )
}

function PrivacyPage({ setCurrentPage }: { setCurrentPage: (p: string) => void }) {
  return (
    <ContentPolicyPage title="PRIVACY POLICY" setCurrentPage={setCurrentPage}>
      <section>
        <h2 className="text-base font-normal tracking-widest mb-3">INFORMATION WE COLLECT</h2>
        <p className="text-muted-foreground">We collect information you provide directly when making purchases, creating accounts, or contacting support. This includes your name, email address, billing information, and order details. We also collect usage data to improve our services.</p>
      </section>
      <section>
        <h2 className="text-base font-normal tracking-widest mb-3">HOW WE USE YOUR INFORMATION</h2>
        <p className="text-muted-foreground">Your information is used to process orders, deliver digital products, provide customer support, and improve our platform. We do not sell your personal information to third parties.</p>
      </section>
      <section>
        <h2 className="text-base font-normal tracking-widest mb-3">DATA SECURITY</h2>
        <p className="text-muted-foreground">We implement industry-standard security measures to protect your data. All transactions are encrypted using SSL/TLS. Payment information is processed through secure, PCI-compliant payment processors.</p>
      </section>
      <section>
        <h2 className="text-base font-normal tracking-widest mb-3">COOKIES</h2>
        <p className="text-muted-foreground">We use cookies to enhance your browsing experience, remember your preferences, and analyze platform usage. You can control cookie settings through your browser preferences.</p>
      </section>
      <section>
        <h2 className="text-base font-normal tracking-widest mb-3">CONTACT</h2>
        <p className="text-muted-foreground">For privacy-related inquiries, contact us at sedaqui@gmail.com.</p>
      </section>
    </ContentPolicyPage>
  )
}

function TermsPage({ setCurrentPage }: { setCurrentPage: (p: string) => void }) {
  return (
    <ContentPolicyPage title="TERMS & CONDITIONS" setCurrentPage={setCurrentPage}>
      <section>
        <h2 className="text-base font-normal tracking-widest mb-3">ACCEPTANCE OF TERMS</h2>
        <p className="text-muted-foreground">By accessing and using SEDAQUI, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our services.</p>
      </section>
      <section>
        <h2 className="text-base font-normal tracking-widest mb-3">PRODUCT PURCHASES</h2>
        <p className="text-muted-foreground">All purchases are subject to availability. Prices are displayed in USD and may change without notice. Digital products are delivered electronically. Physical products are shipped to the address provided at checkout.</p>
      </section>
      <section>
        <h2 className="text-base font-normal tracking-widest mb-3">AI AGENT SERVICES</h2>
        <p className="text-muted-foreground">AI agents are provided as-is and may have limitations. We do not guarantee specific outcomes from AI agent interactions. Usage is subject to fair use policies.</p>
      </section>
      <section>
        <h2 className="text-base font-normal tracking-widest mb-3">INTELLECTUAL PROPERTY</h2>
        <p className="text-muted-foreground">All content, branding, and materials on SEDAQUI are protected by intellectual property laws. Purchased digital products grant you a personal, non-transferable license for use.</p>
      </section>
      <section>
        <h2 className="text-base font-normal tracking-widest mb-3">LIMITATION OF LIABILITY</h2>
        <p className="text-muted-foreground">SEDAQUI is not liable for any indirect, incidental, or consequential damages arising from use of our products or services.</p>
      </section>
    </ContentPolicyPage>
  )
}

function RefundPage({ setCurrentPage }: { setCurrentPage: (p: string) => void }) {
  return (
    <ContentPolicyPage title="REFUND POLICY" setCurrentPage={setCurrentPage}>
      <section>
        <h2 className="text-base font-normal tracking-widest mb-3">DIGITAL PRODUCTS</h2>
        <p className="text-muted-foreground">Digital products (e-books, courses, apps, SaaS tools) are eligible for a full refund within 30 days of purchase, provided less than 25% of the content has been accessed or consumed. Refund requests can be submitted via email or through the Contact page.</p>
      </section>
      <section>
        <h2 className="text-base font-normal tracking-widest mb-3">PHYSICAL PRODUCTS</h2>
        <p className="text-muted-foreground">Physical products may be returned within 30 days of delivery in original, unused condition with all packaging intact. Return shipping costs are the responsibility of the buyer unless the item is defective. Refunds are processed within 5-10 business days after receiving the returned item.</p>
      </section>
      <section>
        <h2 className="text-base font-normal tracking-widest mb-3">AI AGENTS</h2>
        <p className="text-muted-foreground">AI agents may be refunded within 7 days of purchase if you are not satisfied with the service. After 7 days, refunds are evaluated on a case-by-case basis. Contact sedaqui@gmail.com to initiate a refund request.</p>
      </section>
      <section>
        <h2 className="text-base font-normal tracking-widest mb-3">HOW TO REQUEST A REFUND</h2>
        <p className="text-muted-foreground">Email sedaqui@gmail.com with your order number, the product(s) you wish to return, and the reason for the refund. Our team will respond within 24 hours with next steps.</p>
      </section>
    </ContentPolicyPage>
  )
}

// === FLOATING CHATBOT WIDGET ===
function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const handleChatSend = async () => {
    if (!chatInput.trim() || chatLoading) return
    const userMsg = chatInput.trim()
    setChatInput('')
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setChatLoading(true)
    try {
      const result = await callAIAgent(userMsg, AGENT_IDS.CUSTOMER_SUPPORT)
      const parsed = parseAgentResponse(result)
      const answer = parsed?.answer ?? parsed?.text ?? result?.response?.message ?? 'I apologize, I could not process your request at this time.'
      const followUp = parsed?.follow_up_question ?? ''
      const category = parsed?.category ?? ''
      setChatMessages(prev => [...prev, { role: 'assistant', content: answer, followUp, category }])
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'An error occurred. Please try again.' }])
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-5 left-5 z-[55] w-14 h-14 flex items-center justify-center bg-primary text-primary-foreground border border-primary/60 shadow-lg hover:shadow-xl transition-all duration-300 ${isOpen ? 'scale-90' : 'animate-pulse hover:animate-none hover:scale-105'}`}
        style={{ animationDuration: '3s' }}
        aria-label="Open support chat"
      >
        {isOpen ? <FiX size={22} /> : <FiMessageSquare size={22} />}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 left-5 z-[55] w-[340px] sm:w-[380px] h-[500px] bg-card border border-border shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
            <div className="flex items-center gap-2">
              <FiMessageSquare size={16} className="text-primary" />
              <span className="text-sm font-normal tracking-widest text-foreground">SEDAQUI SUPPORT</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground"><FiX size={16} /></button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {chatMessages.length === 0 && (
                <div className="text-center py-8">
                  <FiMessageSquare size={28} className="mx-auto text-muted-foreground mb-3" />
                  <p className="text-xs text-muted-foreground font-light tracking-wider mb-1">Welcome to SEDAQUI Support</p>
                  <p className="text-xs text-muted-foreground font-light">Ask about products, orders, or policies</p>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 text-sm font-light leading-relaxed ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 text-foreground border border-border'}`}>
                    {msg.role === 'assistant' ? renderMarkdown(msg.content) : msg.content}
                    {msg.followUp && (
                      <button onClick={() => setChatInput(msg.followUp ?? '')} className="block mt-2 text-xs text-primary hover:underline font-light tracking-wider">
                        {msg.followUp}
                      </button>
                    )}
                    {msg.category && <Badge variant="outline" className="mt-2 text-xs font-light">{msg.category}</Badge>}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-secondary/50 border border-border p-3 text-sm text-muted-foreground font-light flex items-center gap-2">
                    <FiLoader size={14} className="animate-spin" /> Thinking...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="flex gap-2 p-3 border-t border-border">
            <Input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleChatSend()}
              placeholder="Type your question..."
              className="bg-secondary/30 border-border text-sm font-light"
            />
            <Button onClick={handleChatSend} disabled={chatLoading || !chatInput.trim()} size="sm" className="tracking-widest px-3">
              <FiSend size={14} />
            </Button>
          </div>
        </div>
      )}
    </>
  )
}

// === MAIN PAGE EXPORT ===
export default function Page() {
  const [currentPage, setCurrentPage] = useState('home')
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [showSample, setShowSample] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<SampleProduct | null>(null)
  const [productModalOpen, setProductModalOpen] = useState(false)

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const addToCart = useCallback((product: SampleProduct) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
      }
      return [...prev, { id: product.id, title: product.title, price: product.price, quantity: 1, category: product.category, type: product.type }]
    })
  }, [])

  const viewProduct = useCallback((product: SampleProduct) => {
    setSelectedProduct(product)
    setProductModalOpen(true)
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentPage])

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage setCurrentPage={setCurrentPage} onAddToCart={addToCart} onView={viewProduct} showSample={showSample} />
      case 'digital':
        return <DigitalHubPage onAddToCart={addToCart} onView={viewProduct} showSample={showSample} />
      case 'shop':
        return <SmartShopPage onAddToCart={addToCart} onView={viewProduct} showSample={showSample} />
      case 'agents':
        return <AIAgentStorePage onAddToCart={addToCart} onView={viewProduct} showSample={showSample} />
      case 'contact':
        return <ContactPage />
      case 'admin':
        return <AdminPanel />
      case 'faq':
        return <FAQPage setCurrentPage={setCurrentPage} />
      case 'privacy':
        return <PrivacyPage setCurrentPage={setCurrentPage} />
      case 'terms':
        return <TermsPage setCurrentPage={setCurrentPage} />
      case 'refund':
        return <RefundPage setCurrentPage={setCurrentPage} />
      default:
        return <HomePage setCurrentPage={setCurrentPage} onAddToCart={addToCart} onView={viewProduct} showSample={showSample} />
    }
  }

  return (
    <ErrorBoundary>
      <div style={THEME_VARS} className="min-h-screen bg-background text-foreground font-serif">
        <SiteHeader currentPage={currentPage} setCurrentPage={setCurrentPage} cartCount={cartCount} onCartOpen={() => setCartOpen(true)} />

        <div className="fixed top-20 right-4 z-40 flex items-center gap-2 bg-card border border-border px-3 py-2 shadow-lg">
          <Label htmlFor="sample-toggle" className="text-xs tracking-widest font-light text-muted-foreground cursor-pointer">SAMPLE DATA</Label>
          <Switch id="sample-toggle" checked={showSample} onCheckedChange={setShowSample} />
        </div>

        <main className="min-h-[calc(100vh-4rem)]">
          {renderCurrentPage()}
        </main>

        <FooterSection setCurrentPage={setCurrentPage} />

        <CartDrawer cart={cart} setCart={setCart} open={cartOpen} onClose={() => setCartOpen(false)} />

        <ProductDetailModal product={selectedProduct} open={productModalOpen} onClose={() => setProductModalOpen(false)} onAddToCart={addToCart} />

        {/* Global Floating Chatbot Widget */}
        <ChatbotWidget />
      </div>
    </ErrorBoundary>
  )
}
