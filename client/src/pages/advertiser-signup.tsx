import { useState } from "react";
import { Link } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Landmark, Check, DollarSign, Users, BarChart, Crown, Star, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

// Form schema remains unchanged
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

// Pricing plans remain unchanged
const pricingPlans = [
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
    icon: Star,
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
    icon: Crown,
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
    icon: Award,
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
    setStep("success");
    toast({
      title: "Application submitted",
      description: "We'll contact you soon to discuss your advertising needs.",
    });
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <header className="mb-8">
          <Link href="/" className="inline-flex items-center text-blue-400 hover:text-blue-300">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Content
          </Link>
          <h1 className="text-4xl font-bold mt-6 mb-2 text-white">Advertiser Program</h1>
          <p className="text-gray-300 max-w-2xl">
            Join our <span className="text-blue-400">premium advertising network</span> and connect with millions of engaged readers and viewers. 
            Our platform offers targeted placement across various content categories.
          </p>
        </header>

        {step === "info" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Card className="bg-black backdrop-blur border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Advertiser Application</CardTitle>
                  <CardDescription className="text-gray-300">
                    Fill out the form below to join our <span className="text-blue-400">elite advertiser program</span>
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
                              <FormLabel className="text-white">Company Name</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Your company name" 
                                  {...field} 
                                  className="bg-black text-white placeholder:text-gray-400 border-gray-700" 
                                />
                              </FormControl>
                              <FormMessage className="text-red-400" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="contactName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Contact Name</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Your full name" 
                                  {...field} 
                                  className="bg-black text-white placeholder:text-gray-400 border-gray-700" 
                                />
                              </FormControl>
                              <FormMessage className="text-red-400" />
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
                              <FormLabel className="text-white">Email Address</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="your.email@company.com" 
                                  {...field} 
                                  className="bg-black text-white placeholder:text-gray-400 border-gray-700" 
                                />
                              </FormControl>
                              <FormMessage className="text-red-400" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Phone Number</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="+1 (555) 000-0000" 
                                  {...field} 
                                  className="bg-black text-white placeholder:text-gray-400 border-gray-700" 
                                />
                              </FormControl>
                              <FormMessage className="text-red-400" />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="industry"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Industry</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-black text-white border-gray-700">
                                  <SelectValue placeholder="Select your industry" className="text-gray-400" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-black text-white border-gray-700">
                                <SelectItem value="technology">Technology</SelectItem>
                                <SelectItem value="education">Education</SelectItem>
                                <SelectItem value="finance">Finance</SelectItem>
                                <SelectItem value="healthcare">Healthcare</SelectItem>
                                <SelectItem value="retail">Retail</SelectItem>
                                <SelectItem value="entertainment">Entertainment</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="budget"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Monthly Advertising Budget</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-black text-white border-gray-700">
                                  <SelectValue placeholder="Select your budget range" className="text-gray-400" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-black text-white border-gray-700">
                                <SelectItem value="starter">$99 - $499</SelectItem>
                                <SelectItem value="growing">$500 - $1,999</SelectItem>
                                <SelectItem value="established">$2,000 - $9,999</SelectItem>
                                <SelectItem value="enterprise">$10,000+</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="adType"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel className="text-white">Preferred Ad Type</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex flex-col space-y-1"
                              >
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="standard" className="text-blue-400 border-gray-400" />
                                  </FormControl>
                                  <FormLabel className="font-normal text-gray-200">
                                    Standard Display Ads
                                  </FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="sponsored" className="text-blue-400 border-gray-400" />
                                  </FormControl>
                                  <FormLabel className="font-normal text-gray-200">
                                    Sponsored Content
                                  </FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="premium" className="text-blue-400 border-gray-400" />
                                  </FormControl>
                                  <FormLabel className="font-normal text-gray-200">
                                    Premium Placement
                                  </FormLabel>
                                </FormItem>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Additional Information (Optional)</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Tell us more about your advertising goals and target audience"
                                className="min-h-[120px] bg-black text-white placeholder:text-gray-400 border-gray-700"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Submit Application
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="bg-black backdrop-blur border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Why Advertise With Us?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-yellow-400 mt-1" />
                    <div>
                      <h3 className="font-medium text-white">Engaged Audience</h3>
                      <p className="text-sm text-gray-300">Over 2 million monthly active users exploring educational content</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <BarChart className="h-5 w-5 text-yellow-400 mt-1" />
                    <div>
                      <h3 className="font-medium text-white">Precise Targeting</h3>
                      <p className="text-sm text-gray-300">Target specific content categories and user interests</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <DollarSign className="h-5 w-5 text-yellow-400 mt-1" />
                    <div>
                      <h3 className="font-medium text-white">Cost Effective</h3>
                      <p className="text-sm text-gray-300">Only pay for meaningful interactions with your ads</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black backdrop-blur border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Premium Pricing Plans</CardTitle>
                  <CardDescription className="text-gray-300">
                    Select an <span className="text-blue-400">elite plan</span> that fits your needs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pricingPlans.map((plan) => {
                    const Icon = plan.icon;
                    return (
                      <div 
                        key={plan.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          selectedPlan === plan.id 
                            ? "border-blue-400 bg-blue-400/10" 
                            : "border-gray-700 hover:border-gray-600"
                        } ${plan.highlighted ? "ring-2 ring-yellow-400" : ""}`}
                        onClick={() => setSelectedPlan(plan.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <Icon className="h-5 w-5 text-yellow-400" />
                            <div>
                              <h3 className="font-medium text-white">{plan.name}</h3>
                              <p className="text-sm text-gray-300">{plan.description}</p>
                            </div>
                          </div>
                          <div className="font-bold text-blue-400">{plan.price}</div>
                        </div>
                        <Separator className="my-3 bg-gray-700" />
                        <ul className="space-y-2">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-center text-sm text-gray-200">
                              <Check className="h-4 w-4 text-yellow-400 mr-2 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto text-center">
            <div className="rounded-full w-16 h-16 bg-blue-400/20 text-blue-400 flex items-center justify-center mx-auto mb-6">
              <Check className="h-8 w-8" />
            </div>
            <h2 className="text-3xl font-bold mb-4 text-white">Thank You For Your Interest!</h2>
            <p className="text-gray-300 mb-8">
              We've received your application and will review it shortly. One of our 
              <span className="text-blue-400"> premium advertising specialists</span> will contact you within 
              1-2 business days to discuss your specific needs and set up your campaign.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="outline" 
                asChild 
                className="border-gray-600 text-white hover:bg-gray-800"
              >
                <Link href="/">
                  Return to Content
                </Link>
              </Button>
              <Button 
                variant="default" 
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
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