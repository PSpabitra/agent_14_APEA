import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
    Activity,
    ShieldCheck,
    Zap,
    Database,
    ArrowRight,
    BrainCircuit,
    Search,
    Cpu,
    CheckCircle2,
    Layers,
    BarChart3,
    Bot
} from "lucide-react";

const FeatureCard = ({ icon: Icon, title, description, delay }: { icon: any, title: string, description: string, delay: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay }}
        className="bg-white border border-gray-100 p-8 rounded-3xl hover:shadow-xl hover:shadow-indigo-500/5 transition-all group cursor-pointer"
    >
        <div className="h-14 w-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <Icon className="text-indigo-600 h-7 w-7" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
        <p className="text-gray-600 leading-relaxed">{description}</p>
    </motion.div>
);

const StepCard = ({ number, title, description, delay }: { number: string, title: string, description: string, delay: number }) => (
    <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay }}
        className="flex gap-6 items-start"
    >
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-indigo-200">
            {number}
        </div>
        <div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">{title}</h4>
            <p className="text-gray-600 leading-relaxed">{description}</p>
        </div>
    </motion.div>
);

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-[#FDFDFF] text-gray-900 selection:bg-indigo-100 selection:text-indigo-900 font-sans overflow-x-hidden">
            {/* Dynamic Background Elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-indigo-100/50 blur-[100px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-blue-50/50 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.03] pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(#4F46E5 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            </div>

            <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
                {/* Navigation */}
                <nav className="flex items-center justify-between py-8 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                            <BrainCircuit className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-2xl font-black tracking-tighter text-gray-900">
                            APEA
                        </span>
                    </div>
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-sm font-semibold text-gray-600 hover:text-indigo-600 transition-colors">Features</a>
                        <a href="#how-it-works" className="text-sm font-semibold text-gray-600 hover:text-indigo-600 transition-colors">How it Works</a>
                        <Link to="/login" className="text-sm font-semibold text-gray-900 hover:text-indigo-600 transition-colors">Sign In</Link>
                        <Link
                            to="/dashboard"
                            className="text-sm font-bold bg-gray-900 text-white px-6 py-3 rounded-full hover:bg-gray-800 transition-all shadow-xl shadow-gray-200 hover:-translate-y-0.5 active:translate-y-0"
                        >
                            Open Platform
                        </Link>
                    </div>
                </nav>

                {/* Hero Section */}
                <section className="pt-20 pb-32 flex flex-col items-center text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 mb-8"
                    >
                        <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-ping"></span>
                        <span className="text-xs font-bold text-indigo-700 tracking-wider uppercase">Project Overview & Insights</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.1 }}
                        className="text-5xl lg:text-7xl font-black tracking-tight text-gray-900 mb-8 leading-[1.1]"
                    >
                        Resolution at the <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-600">
                            Speed of Thought
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.2 }}
                        className="text-xl text-gray-600 max-w-2xl mx-auto mb-12 leading-relaxed"
                    >
                        Autonomous Problem Engine for Action. The first AI-native incident management platform that observes your stack, reasons through complexities, and acts autonomously.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center gap-5"
                    >
                        <Link
                            to="/dashboard"
                            className="flex items-center justify-center gap-2 px-10 py-5 rounded-2xl bg-indigo-600 text-white font-bold text-lg hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-200 hover:-translate-y-1 group"
                        >
                            Enter Dashboard
                            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </motion.div>
                </section>

                {/* Stats Section */}
                <section className="pb-32 grid grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
                    {[
                        { label: "MTTR Reduction", value: "85%", icon: Zap },
                        { label: "Auto-Remediated", value: "60k+", icon: Bot },
                        { label: "Data Ingested", value: "12PB", icon: Database },
                        { label: "Efficiency Gain", value: "12x", icon: Activity },
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white p-6 rounded-2xl border border-gray-100 text-center shadow-sm"
                        >
                            <div className="text-3xl font-black text-gray-900 mb-1">{stat.value}</div>
                            <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{stat.label}</div>
                        </motion.div>
                    ))}
                </section>

                {/* Features Grid */}
                <section id="features" className="pb-32 relative z-10">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl font-black text-gray-900 mb-4">Powerful Core Capabilities</h2>
                        <p className="text-gray-600 max-w-xl mx-auto">Built from the ground up to handle enterprise-scale infrastructure with AI precision.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard
                            delay={0.1}
                            icon={Search}
                            title="Semantic Investigation"
                            description="Search through logs and metrics using natural language. Our RAG engine understands context, not just keywords."
                        />
                        <FeatureCard
                            delay={0.2}
                            icon={Cpu}
                            title="Reasoning Engine"
                            description="LLM-powered analysis that links disparate events into a single coherent timeline of what went wrong and why."
                        />
                        <FeatureCard
                            delay={0.3}
                            icon={CheckCircle2}
                            title="One-Click Fixes"
                            description="Don't just diagnose. APEA generates executable action plans that you can approve and deploy in seconds."
                        />
                        <FeatureCard
                            delay={0.4}
                            icon={Layers}
                            title="Knowledge Mapping"
                            description="Automatically indexes your runbooks, documentation, and historical tickets to build a local intelligence graph."
                        />
                        <FeatureCard
                            delay={0.5}
                            icon={BarChart3}
                            title="Anomaly Detection"
                            description="Predictive monitoring that alerts you to subtle deviations before they escalate into full-blown production outages."
                        />
                        <FeatureCard
                            delay={0.6}
                            icon={ShieldCheck}
                            title="Secure by Design"
                            description="Enterprise-grade security with role-based access control, data encryption, and transparent AI audit logs."
                        />
                    </div>
                </section>

                {/* How It Works */}
                <section id="how-it-works" className="pb-32 relative z-10 bg-indigo-50/50 -mx-6 px-6 py-24 rounded-[3rem]">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-black text-gray-900 mb-6">The Incident Loop</h2>
                            <p className="text-gray-600">A simplified three-step process to maintain system health at scale.</p>
                        </div>
                        <div className="space-y-12">
                            <StepCard
                                number="01"
                                delay={0.1}
                                title="Observe everything"
                                description="Connect your cloud providers, logs, and monitoring tools. APEA ingests and normalizes metrics in real-time, creating a unified view of your entire architecture."
                            />
                            <StepCard
                                number="02"
                                delay={0.2}
                                title="Reason through chaos"
                                description="When an anomaly is detected, the AI Reasoning Engine analyzes the context, consults your knowledge base, and performs deep root cause analysis automatically."
                            />
                            <StepCard
                                number="03"
                                delay={0.3}
                                title="Act with confidence"
                                description="Receive a prioritized list of remediation steps. Use the 'Incident Loop' workflow to approve actions, clear the ticket, and document the resolution for future reference."
                            />
                        </div>
                    </div>
                </section>

                {/* Closing CTA */}
                <section className="py-32 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-gray-900 rounded-[3rem] p-12 md:p-24 text-center text-white relative overflow-hidden shadow-2xl"
                    >
                        <div className="absolute top-0 left-0 w-full h-full opacity-10"
                            style={{ backgroundImage: 'linear-gradient(45deg, #4f46e5 25%, transparent 25%, transparent 50%, #4f46e5 50%, #4f46e5 75%, transparent 75%, transparent)', backgroundSize: '100px 100px' }} />

                        <div className="relative z-10">
                            <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight">
                                Ready to transform your <br /> incident response?
                            </h2>
                            <p className="text-gray-400 text-lg mb-12 max-w-xl mx-auto">
                                Join high-performing engineering teams using APEA to resolve issues 10x faster.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                                <Link
                                    to="/dashboard"
                                    className="px-10 py-5 rounded-2xl bg-white text-gray-900 font-bold text-lg hover:bg-gray-100 transition-all"
                                >
                                    Get Started for Free
                                </Link>
                                <Link
                                    to="/login"
                                    className="px-10 py-5 rounded-2xl bg-gray-800 text-white font-bold text-lg hover:bg-gray-700 transition-all border border-gray-700"
                                >
                                    Schedule Demo
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </section>

                {/* Footer */}
                <footer className="py-12 border-t border-gray-100 text-center text-gray-500 text-sm">
                    <p>© 2026 APEA - Autonomous Problem Engine for Action. All rights reserved.</p>
                </footer>
            </div>
        </div>
    );
};

export default LandingPage;
