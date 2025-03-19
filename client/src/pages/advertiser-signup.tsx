import { useState } from "react";
import { Link } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Landmark, Check, DollarSign, Users, BarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

// Form schema for advertiser signup
const formSchema = z.object({
  companyName: z.string().min(2, { message: "Company name must be at least 2 characters" }),
  contactName: z.string().min(2, { message: "Contact name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z.string().min(10, { message: "Phone number is required" }),
  budget: z.string().min(1, { message: "Budget is required" }),
  industry: z.string().min(1, { message: "Please select your industry" }),
  adType: z.string().min(1, { message: "Please select your preferred ad type" }),
  message: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// Pricing plan definitions
interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: string;
  features: string[];
  highlighted?: boolean;
}

const pricingPlans: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "Perfect for new advertisers",
    price: "$99/month",
    features: [
      "Up to 3 ad placements",
      "Basic analytics",
      "Standard support",
    ],
  },
  {
    id: "pro",
    name: "Professional",
    description: "For growing brands",
    price: "$299/month",
    features: [
      "Up to 10 ad placements",
      "Advanced targeting",
      "Detailed analytics dashboard",
      "Priority support",
    ],
    highlighted: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For larger organizations",
    price: "Custom pricing",
    features: [
      "Unlimited ad placements",
      "Premium targeting",
      "Custom reporting",
      "Dedicated account manager",
      "Content integration options",
    ],
  },
];

export default function AdvertiserSignup() {
  const { toast } = useToast();
  const [step, setStep] = useState<"info" | "success">("info");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      contactName: "",
      email: "",
      phone: "",
      budget: "",
      industry: "",
      adType: "",
      message: "",
    },
  });

  function onSubmit(data: FormValues) {
    console.log("Form submitted:", data);
    
    // In a real application, this would send the data to the server
    // Here we're just showing a success message
    setStep("success");
    toast({
      title: "Application submitted",
      description: "We'll contact you soon to discuss your advertising needs.",
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <header className="mb-8">
          <Link href="/" className="inline-flex items-center text-primary hover:text-primary/80">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Content
          </Link>
          <h1 className="text-4xl font-bold mt-6 mb-2">Advertiser Program</h1>
          <p className="text-gray-400 max-w-2xl">
            Join our advertising network and connect with millions of engaged readers and viewers. 
            Our platform offers targeted placement across various content categories.
          </p>
        </header>

        {step === "info" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Card className="bg-black/50 backdrop-blur border-gray-800">
                <CardHeader>
                  <CardTitle>Advertiser Application</CardTitle>
                  <CardDescription className="text-gray-400">
                    Fill out the form below to join our advertiser program
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="companyName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Company Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Your company name" {...field} className="bg-black/30" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="contactName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Your full name" {...field} className="bg-black/30" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address</FormLabel>
                              <FormControl>
                                <Input placeholder="your.email@company.com" {...field} className="bg-black/30" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input placeholder="+1 (555) 000-0000" {...field} className="bg-black/30" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="industry"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Industry</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-black/30">
                                  <SelectValue placeholder="Select your industry" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="technology">Technology</SelectItem>
                                <SelectItem value="education">Education</SelectItem>
                                <SelectItem value="finance">Finance</SelectItem>
                                <SelectItem value="healthcare">Healthcare</SelectItem>
                                <SelectItem value="retail">Retail</SelectItem>
                                <SelectItem value="entertainment">Entertainment</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="budget"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Monthly Advertising Budget</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-black/30">
                                  <SelectValue placeholder="Select your budget range" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="starter">$99 - $499</SelectItem>
                                <SelectItem value="growing">$500 - $1,999</SelectItem>
                                <SelectItem value="established">$2,000 - $9,999</SelectItem>
                                <SelectItem value="enterprise">$10,000+</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="adType"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Preferred Ad Type</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex flex-col space-y-1"
                              >
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="standard" />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    Standard Display Ads
                                  </FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="sponsored" />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    Sponsored Content
                                  </FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="premium" />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    Premium Placement
                                  </FormLabel>
                                </FormItem>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Additional Information (Optional)</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Tell us more about your advertising goals and target audience"
                                className="min-h-[120px] bg-black/30"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button type="submit" className="w-full">
                        Submit Application
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="bg-black/50 backdrop-blur border-gray-800">
                <CardHeader>
                  <CardTitle>Why Advertise With Us?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <h3 className="font-medium">Engaged Audience</h3>
                      <p className="text-sm text-gray-400">Over 2 million monthly active users exploring educational content</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <BarChart className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <h3 className="font-medium">Precise Targeting</h3>
                      <p className="text-sm text-gray-400">Target specific content categories and user interests</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <DollarSign className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <h3 className="font-medium">Cost Effective</h3>
                      <p className="text-sm text-gray-400">Only pay for meaningful interactions with your ads</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/50 backdrop-blur border-gray-800">
                <CardHeader>
                  <CardTitle>Pricing Plans</CardTitle>
                  <CardDescription className="text-gray-400">
                    Select a plan that fits your needs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pricingPlans.map((plan) => (
                    <div 
                      key={plan.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedPlan === plan.id 
                          ? "border-primary bg-primary/10" 
                          : "border-gray-800 hover:border-gray-700"
                      } ${plan.highlighted ? "ring-1 ring-primary" : ""}`}
                      onClick={() => setSelectedPlan(plan.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{plan.name}</h3>
                          <p className="text-sm text-gray-400">{plan.description}</p>
                        </div>
                        <div className="font-bold">{plan.price}</div>
                      </div>
                      <Separator className="my-3 bg-gray-800" />
                      <ul className="space-y-2">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center text-sm">
                            <Check className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto text-center">
            <div className="rounded-full w-16 h-16 bg-primary/20 text-primary flex items-center justify-center mx-auto mb-6">
              <Check className="h-8 w-8" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Thank You For Your Interest!</h2>
            <p className="text-gray-400 mb-8">
              We've received your application and will review it shortly. One of our advertising specialists will contact you within 1-2 business days to discuss your specific needs and set up your campaign.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" asChild>
                <Link href="/">
                  Return to Content
                </Link>
              </Button>
              <Button variant="default">
                <Landmark className="mr-2 h-4 w-4" />
                View Advertiser Resources
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}