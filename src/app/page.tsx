
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Wand2,
  Image as ImageIcon,
  Download,
  PlusCircle,
  MessageSquare,
  Sparkles,
  Paperclip,
  ArrowUp,
  User,
  Loader2,
  X,
} from "lucide-react";
import { cartoonifyImage, CartoonifyImageInput } from "@/ai/flows/cartoonify-image";
import NextImage from "next/image";
import { Textarea } from "@/components/ui/textarea";
import { describeImage } from "@/ai/flows/describe-image";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarContent, SidebarHeader, SidebarInset, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { enhancePrompt } from "@/ai/flows/enhance-prompt";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { GeneratingIndicator } from "@/components/generating-indicator";
import type * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

const styleSuggestions = [
  "Pixar movie style, 3D render",
  "Classic Looney Tunes style",
  "Japanese Anime (Makoto Shinkai)",
  "Claymation (Wallace and Gromit)",
  "90s Cartoon (Simpsons style)",
  "South Park style cutout animation",
];

type Message = {
    id: string;
    role: 'user' | 'assistant';
    text?: string;
    image?: string;
    originalImage?: string | null | undefined;
    originalPrompt?: string; 
    isLoading?: boolean;
}

type Conversation = {
    id:string;
    title: string;
    messages: Message[];
    timestamp: Date;
}


export default function ToonifyPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  
  const [prompt, setPrompt] = useState("");
  const [uploadImage, setUploadImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<React.ElementRef<typeof ScrollAreaPrimitive.Root>>(null);
  const { toast } = useToast();

  const getActiveConversation = (): Conversation | undefined => {
    return conversations.find(c => c.id === activeConversationId);
  }

  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: `conv-${Date.now()}`,
      title: "New Creation",
      messages: [],
      timestamp: new Date()
    };
    setConversations(prev => [newConversation, ...prev]);
    setActiveConversationId(newConversation.id);
    setPrompt("");
    setUploadImage(null);
  };
  
  useEffect(() => {
    if (conversations.length === 0) {
        createNewConversation();
    }
    if (!activeConversationId && conversations.length > 0) {
        setActiveConversationId(conversations[0].id);
    }
  }, [conversations, activeConversationId]);

  const activeConversation = getActiveConversation();

  useEffect(() => {
    const scrollViewport = scrollAreaRef.current?.children[0] as HTMLDivElement | undefined;
    if (scrollViewport) {
        scrollViewport.scrollTo({
            top: scrollViewport.scrollHeight,
            behavior: 'smooth'
        });
    }
  }, [activeConversation?.messages.length]);


  const handleFileSelect = (file: File | null) => {
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        toast({ title: "File too large", description: "Please select an image smaller than 4MB.", variant: "destructive" });
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast({ title: "Invalid file type", description: "Please select an image file.", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUri = e.target?.result as string;
        setUploadImage(dataUri);
        toast({ title: "Image attached", description: "Your image is ready to be used in your prompt." });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(event.target.files?.[0] || null);
    if(event.target) {
        event.target.value = "";
    }
  };

  const handleEnhancePrompt = async () => {
    if (!prompt) {
        toast({ title: "Nothing to enhance", description: "Please enter a prompt first.", variant: "destructive" });
        return;
    }
    setIsEnhancing(true);
    try {
        const { enhancedPrompt } = await enhancePrompt({ prompt });
        setPrompt(enhancedPrompt);
    } catch(e) {
        toast({ title: "Failed to enhance prompt", variant: "destructive" });
    } finally {
        setIsEnhancing(false);
    }
  }

  const updateConversation = (convoId: string, updates: Partial<Conversation> | ((c: Conversation) => Partial<Conversation>) ) => {
     setConversations(prev => prev.map(c => {
        if (c.id === convoId) {
            const newValues = typeof updates === 'function' ? updates(c) : updates;
            return {...c, ...newValues};
        }
        return c;
     }));
  }

  const addMessageToConversation = (convoId: string, message: Message) => {
    updateConversation(convoId, (c) => ({ messages: [...c.messages, message] }));
  }

  const updateMessageInConversation = (convoId: string, messageId: string, updates: Partial<Message>) => {
    updateConversation(convoId, (c) => ({
        messages: c.messages.map(m => m.id === messageId ? {...m, ...updates} : m)
    }));
  }


  const handleGenerate = async ({ existingPrompt, existingImage }: { existingPrompt?: string, existingImage?: string } = {}) => {
    const currentPrompt = existingPrompt ?? prompt;
    const currentUploadImage = existingImage ?? uploadImage;
    
    if (!currentPrompt && !currentUploadImage) {
        toast({ title: "Nothing to generate", description: "Please enter a prompt or upload an image.", variant: "destructive" });
        return;
    }
    if (!activeConversationId) return;

    setIsLoading(true);

    if (!existingPrompt) { 
        const userMessage: Message = {
            id: `msg-${Date.now()}`,
            role: 'user',
            text: currentPrompt,
            image: currentUploadImage === null ? undefined : currentUploadImage,
        };
        addMessageToConversation(activeConversationId, userMessage);
    }

    const assistantMessageId = `msg-${Date.now()}-ai`;
    addMessageToConversation(activeConversationId, {
        id: assistantMessageId,
        role: 'assistant',
        isLoading: true,
        originalImage: currentUploadImage
    });

    if (!existingPrompt) {
        setPrompt("");
        setUploadImage(null);
    }
    
    try {
      let finalPrompt = currentPrompt;

      if (currentUploadImage && !finalPrompt) {
          const { description } = await describeImage({photoDataUri: currentUploadImage});
          finalPrompt = `${description}, in the style of ${styleSuggestions[0]}`;
      } else if (currentUploadImage && finalPrompt) {
          const { description } = await describeImage({photoDataUri: currentUploadImage});
          finalPrompt = `${description}, in the style of ${finalPrompt}`;
      }

      const input: CartoonifyImageInput = { prompt: finalPrompt };
      if (currentUploadImage) {
        input.photoDataUri = currentUploadImage;
      }
      
      const result = await cartoonifyImage(input);
      
      updateMessageInConversation(activeConversationId, assistantMessageId, {
        isLoading: false,
        text: currentPrompt,
        image: result.cartoonifiedDataUri,
        originalImage: currentUploadImage,
        originalPrompt: finalPrompt,
      });

      const activeConvo = getActiveConversation();
      if(activeConvo && activeConvo.messages.length <= 2 && finalPrompt) {
          updateConversation(activeConversationId, { title: finalPrompt.substring(0, 30) + (finalPrompt.length > 30 ? '...' : '') });
      }

    } catch (e: any) {
      updateMessageInConversation(activeConversationId, assistantMessageId, {
        isLoading: false,
        text: `Error: Could not generate image. Please try again.`,
      });
      toast({
        title: "An error occurred",
        description: "Could not generate the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

    const handleDownload = (imageUrl: string, promptText?: string) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    const defaultName = `toonifyai-image.png`;
    const promptName = promptText ? `${promptText.split(' ')[0].toLowerCase()}_toonify.png` : defaultName;
    link.download = promptName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleEnhanceAndRedo = async (message: Message) => {
    if (!message.originalPrompt) {
        toast({ title: "Cannot enhance", description: "Original prompt not found for this image.", variant: "destructive" });
        return;
    }
    toast({ title: "Enhancing and re-generating..." });
    const { enhancedPrompt } = await enhancePrompt({ prompt: message.originalPrompt });
    await handleGenerate({ existingPrompt: enhancedPrompt, existingImage: message.originalImage ?? undefined });
  }

  const triggerFileSelect = () => fileInputRef.current?.click();

  return (
    <SidebarProvider>
        <Sidebar className="border-r" collapsible="icon">
            <SidebarHeader>
                <div className="flex items-center justify-between p-2">
                    <div className="flex items-center gap-2">
                        <Wand2 className="w-6 h-6 text-primary"/>
                        <h2 className="text-lg font-semibold font-headline">ToonifyAI</h2>
                    </div>
                    <ThemeToggle />
                </div>
            </SidebarHeader>
            <SidebarContent className="p-2">
                <Button variant="outline" className="w-full mb-4" onClick={createNewConversation}>
                    <PlusCircle /> New Creation
                </Button>
                <p className="text-sm font-semibold text-muted-foreground px-2 mb-2">History</p>
                <SidebarMenu>
                    {conversations.map(conv => (
                         <SidebarMenuItem key={conv.id}>
                            <SidebarMenuButton 
                                className="h-auto py-2"
                                isActive={activeConversationId === conv.id}
                                onClick={() => setActiveConversationId(conv.id)}
                            >
                                <div className="flex items-center gap-2">
                                <Avatar className="w-8 h-8">
                                    <AvatarImage src={conv.messages.find(m => m.role === 'assistant' && m.image)?.image || undefined} />
                                    <AvatarFallback>
                                        <MessageSquare />
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col items-start text-left">
                                    <span className="font-medium text-sm truncate max-w-[150px]">
                                        {conv.title}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {conv.timestamp.toLocaleTimeString()}
                                    </span>
                                </div>
                                </div>
                            </SidebarMenuButton>
                         </SidebarMenuItem>
                    ))}
                </SidebarMenu>

            </SidebarContent>
            <SidebarFooter>
                <Card className="bg-muted">
                    <CardContent className="p-4">
                        <p className="text-sm font-medium">Powered by Firebase and Genkit.</p>
                        <p className="text-xs text-muted-foreground">&copy; 2025</p>
                    </CardContent>
                </Card>
            </SidebarFooter>
        </Sidebar>

        <SidebarInset>
            <main className="flex flex-col h-screen">
                <header className="flex items-center p-2 md:p-4 border-b">
                    <SidebarTrigger />
                    <h2 className="text-lg font-semibold ml-2 md:ml-4 truncate">{activeConversation?.title || "New Creation"}</h2>
                </header>

                <div className="flex-1 relative">
                    <ScrollArea className="absolute inset-0" ref={scrollAreaRef}>
                        <div className="p-2 md:p-8 space-y-8 pb-40">
                        {(!activeConversation || activeConversation.messages.length === 0) && !isLoading && (
                            <div className="text-center pt-10 md:pt-20">
                                <Wand2 className="mx-auto h-12 w-12 md:h-16 md:w-16 text-primary/20"/>
                                <h1 className="text-2xl md:text-3xl font-bold font-headline tracking-tight text-primary mt-4">ToonifyAI</h1>
                                <p className="text-muted-foreground mt-2">What will you create today?</p>
                            </div>
                        )}
                        {activeConversation?.messages.map((message) => (
                           <div key={message.id} className={cn("flex items-start gap-2 md:gap-4", message.role === 'user' ? 'justify-end' : 'justify-start')}>
                              {message.role === 'assistant' && (
                                <Avatar className="w-8 h-8">
                                    <AvatarFallback><Wand2/></AvatarFallback>
                                </Avatar>
                              )}
                              <div className={cn(
                                "max-w-md md:max-w-xl p-3 md:p-4 rounded-lg shadow-sm",
                                message.role === 'user' ? 'bg-primary/10' : 'bg-muted'
                              )}>
                                {message.isLoading ? (
                                    <GeneratingIndicator />
                                ) : (
                                    <div className="space-y-2">
                                        {message.text && <p className="mb-2">{message.text}</p>}
                                        {message.image && (
                                            <div className="relative group">
                                                <NextImage src={message.image} alt="Generated content" width={400} height={400} className="rounded-md"/>
                                                 <div className="absolute bottom-2 left-2 right-2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        size="icon"
                                                        variant="secondary"
                                                        onClick={() => handleEnhanceAndRedo(message)}
                                                        disabled={isLoading}
                                                    >
                                                        <Sparkles className="w-5 h-5" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="secondary"
                                                        onClick={() => handleDownload(message.image!, message.text)}
                                                    >
                                                        <Download className="w-5 h-5" />
                                                    </Button>
                                                 </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                              </div>
                               {message.role === 'user' && (
                                <Avatar className="w-8 h-8">
                                    <AvatarFallback><User/></AvatarFallback>
                                </Avatar>
                              )}
                           </div>
                        ))}
                        </div>
                    </ScrollArea>
                </div>

                <div className="fixed bottom-0 left-0 right-0 bg-background/50 backdrop-blur-sm">
                    <div className="max-w-3xl mx-auto p-2 md:p-4 space-y-2 md:space-y-4">
                        <div className="flex items-center gap-2 overflow-x-auto pb-2">
                            {styleSuggestions.map(style => (
                                <Button 
                                    key={style}
                                    variant="outline"
                                    size="sm"
                                    className="shrink-0"
                                    onClick={() => setPrompt(prev => prev ? `${prev}, ${style}` : style)}
                                >
                                    {style}
                                </Button>
                            ))}
                        </div>
                        <Card>
                            <CardContent className="p-1 md:p-2 flex items-center gap-1 md:gap-2 relative">
                                <Input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                <Button size="icon" variant="ghost" onClick={triggerFileSelect}>
                                    <Paperclip className="w-5 h-5"/>
                                </Button>
                                {uploadImage && (
                                    <div className="relative">
                                        <NextImage src={uploadImage} alt="upload preview" width={40} height={40} className="rounded-md object-cover"/>
                                        <button onClick={() => setUploadImage(null)} className="absolute -top-1 -right-1 bg-muted rounded-full p-0.5">
                                            <X className="w-3 h-3"/>
                                        </button>
                                    </div>
                                )}
                                <Textarea
                                    placeholder="Describe the image you want to create..."
                                    className="flex-1 border-0 shadow-none focus-visible:ring-0 resize-none pr-16 md:pr-20"
                                    rows={1}
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleGenerate();
                                        }
                                    }}
                                />
                                <div className="absolute right-2 md:right-3 bottom-2 md:bottom-3 flex items-center gap-1">
                                    <Button size="icon" variant="ghost" onClick={handleEnhancePrompt} disabled={isLoading || isEnhancing} title="Enhance Prompt">
                                        {isEnhancing ? <Loader2 className="w-5 h-5 animate-spin"/> : <Sparkles className="w-5 h-5"/>}
                                    </Button>
                                    <Button size="icon" onClick={() => handleGenerate()} disabled={isLoading}>
                                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : <ArrowUp className="w-5 h-5"/>}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </SidebarInset>
    </SidebarProvider>
  );
}
