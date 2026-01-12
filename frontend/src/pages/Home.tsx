import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, Link as LinkIcon, Thermometer, AlertTriangle, ShieldCheck, Target } from 'lucide-react'

export function Home() {
  const navigate = useNavigate()

  // Animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  }

  const fadeInLeft = {
    initial: { opacity: 0, x: -30 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.7 }
  }



  const floatAnimation = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: [0, -10, 0],
      transition: {
        opacity: { duration: 0.6 },
        y: {
          duration: 3,
          repeat: Infinity
        }
      }
    }
  }

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Section 1: Hero - The Hook */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(6, 182, 212, 0.3) 0%, transparent 50%),
                             radial-gradient(circle at 80% 80%, rgba(20, 184, 166, 0.3) 0%, transparent 50%),
                             radial-gradient(circle at 40% 20%, rgba(14, 165, 233, 0.2) 0%, transparent 50%)`
          }} />
          {/* Network pattern overlay */}
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="network" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <circle cx="50" cy="50" r="2" fill="rgba(6, 182, 212, 0.4)" />
                <line x1="50" y1="50" x2="100" y2="50" stroke="rgba(6, 182, 212, 0.2)" strokeWidth="1" />
                <line x1="50" y1="50" x2="50" y2="100" stroke="rgba(6, 182, 212, 0.2)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#network)" />
          </svg>
        </div>

        <div className="container mx-auto px-6 lg:px-12 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <motion.div
              {...fadeInLeft}
              className="text-white space-y-8"
            >
              <motion.h1 
                className="text-5xl lg:text-7xl font-bold leading-tight"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                Securing Life Itself.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400">
                  The Future of Pharmaceutical Supply Chain.
                </span>
              </motion.h1>

              <motion.p 
                className="text-xl lg:text-2xl text-slate-300 leading-relaxed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                End-to-end transparency, powered by blockchain. Ensuring every dose is genuine, safe, and trackable.
              </motion.p>

              <motion.div 
                className="flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <Button 
                  size="lg" 
                  className="bg-teal-600 hover:bg-teal-700 text-white text-lg px-8 py-6 shadow-lg shadow-teal-500/50 hover:shadow-teal-500/70 transition-all duration-300"
                  onClick={() => navigate('/search')}
                >
                  Explore the Platform
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400/10 text-lg px-8 py-6 transition-all duration-300"
                  onClick={() => navigate('/register')}
                >
                  Join the Network
                </Button>
              </motion.div>

              {/* Trust indicators */}
              <motion.div 
                className="flex gap-8 pt-8 border-t border-slate-700"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.8 }}
              >
                <div>
                  <div className="text-3xl font-bold text-cyan-400">100%</div>
                  <div className="text-sm text-slate-400">Transparency</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-cyan-400">24/7</div>
                  <div className="text-sm text-slate-400">Monitoring</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-cyan-400">∞</div>
                  <div className="text-sm text-slate-400">Immutability</div>
                </div>
              </motion.div>
            </motion.div>

            {/* Right: 3D Image */}
            <motion.div
              {...floatAnimation}
              className="relative"
            >
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-teal-500/20 blur-3xl rounded-full" />
                <img 
                  src="/hero_vial_blockchain_1767855031012.png" 
                  alt="Blockchain-secured pharmaceutical vial"
                  className="relative z-10 w-full h-auto drop-shadow-2xl"
                />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 border-2 border-cyan-400 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-cyan-400 rounded-full mt-2 animate-pulse" />
          </div>
        </motion.div>
      </section>

      {/* Section 2: Our Purpose (Vision, Mission, Goals) */}
      <section className="py-24 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src="/purpose_doctor_patient_1767855048089.png" 
                  alt="Doctor ensuring patient safety"
                  className="w-full h-auto"
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-teal-600/20 to-transparent" />
              </div>
              {/* Decorative element */}
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full blur-3xl opacity-50" />
            </motion.div>

            {/* Right: Cards */}
            <motion.div
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="space-y-6"
            >
              <motion.div variants={fadeInUp}>
                <h2 className="text-4xl lg:text-5xl font-bold mb-4 text-slate-900 dark:text-white">
                  Our Purpose
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-300 mb-8">
                  Building a safer, more transparent pharmaceutical ecosystem for everyone.
                </p>
              </motion.div>

              {/* Vision Card */}
              <motion.div variants={fadeInUp}>
                <Card className="border-2 border-transparent hover:border-teal-500 transition-all duration-300 hover:shadow-lg hover:shadow-teal-500/20 group">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg group-hover:scale-110 transition-transform duration-300">
                        <Eye className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl mb-2">Vision</CardTitle>
                        <CardDescription className="text-base">
                          A world where counterfeit medicine is impossible.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </motion.div>

              {/* Mission Card */}
              <motion.div variants={fadeInUp}>
                <Card className="border-2 border-transparent hover:border-teal-500 transition-all duration-300 hover:shadow-lg hover:shadow-teal-500/20 group">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg group-hover:scale-110 transition-transform duration-300">
                        <LinkIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl mb-2">Mission</CardTitle>
                        <CardDescription className="text-base">
                          To unite manufacturers, distributors, and pharmacies on a single, immutable source of truth.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </motion.div>

              {/* Goals Card */}
              <motion.div variants={fadeInUp}>
                <Card className="border-2 border-transparent hover:border-teal-500 transition-all duration-300 hover:shadow-lg hover:shadow-teal-500/20 group">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg group-hover:scale-110 transition-transform duration-300">
                        <Target className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl mb-2">Goals</CardTitle>
                        <CardDescription className="text-base">
                          Reduce recall times from weeks to seconds. Eliminate fraud. Ensure patient safety.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section 3: What We Offer (The Value Prop) */}
      <section className="py-24 bg-gradient-to-b from-slate-900 to-slate-800 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-6 lg:px-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              The PharmaChain Advantage
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Cutting-edge technology meets pharmaceutical excellence
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-8"
          >
            {/* Card 1: Blockchain Traceability */}
            <motion.div variants={fadeInUp}>
              <Card className="bg-slate-800/50 border-slate-700 hover:border-teal-500 transition-all duration-300 hover:shadow-2xl hover:shadow-teal-500/30 group h-full backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="p-4 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      <LinkIcon className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-2xl text-white mb-3">Blockchain Traceability</CardTitle>
                      <CardDescription className="text-slate-300 text-base leading-relaxed">
                        Track every product's lineage from laboratory to end-user with irrefutable cryptographic proof. Every step is recorded, verified, and permanently stored.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 flex-wrap">
                    <span className="px-3 py-1 bg-teal-500/20 text-teal-300 rounded-full text-sm">Immutable</span>
                    <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-sm">Transparent</span>
                    <span className="px-3 py-1 bg-teal-500/20 text-teal-300 rounded-full text-sm">Verifiable</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Card 2: Smart Quality Control */}
            <motion.div variants={fadeInUp}>
              <Card className="bg-slate-800/50 border-slate-700 hover:border-teal-500 transition-all duration-300 hover:shadow-2xl hover:shadow-teal-500/30 group h-full backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="p-4 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      <Thermometer className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-2xl text-white mb-3">Smart Quality Control</CardTitle>
                      <CardDescription className="text-slate-300 text-base leading-relaxed">
                        Future IoT integration ensures temperature and storage compliance throughout transit. Real-time monitoring prevents quality degradation.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 flex-wrap">
                    <span className="px-3 py-1 bg-teal-500/20 text-teal-300 rounded-full text-sm">IoT Ready</span>
                    <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-sm">Real-time</span>
                    <span className="px-3 py-1 bg-teal-500/20 text-teal-300 rounded-full text-sm">Automated</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Card 3: Instant Recalls */}
            <motion.div variants={fadeInUp}>
              <Card className="bg-slate-800/50 border-slate-700 hover:border-teal-500 transition-all duration-300 hover:shadow-2xl hover:shadow-teal-500/30 group h-full backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="p-4 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      <AlertTriangle className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-2xl text-white mb-3">Instant Recalls</CardTitle>
                      <CardDescription className="text-slate-300 text-base leading-relaxed">
                        Surgical precision in removing unsafe batches instantly. Know exactly where every affected unit is located and remove them from circulation immediately.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 flex-wrap">
                    <span className="px-3 py-1 bg-teal-500/20 text-teal-300 rounded-full text-sm">Instant</span>
                    <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-sm">Precise</span>
                    <span className="px-3 py-1 bg-teal-500/20 text-teal-300 rounded-full text-sm">Life-saving</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Card 4: Fraud Prevention */}
            <motion.div variants={fadeInUp}>
              <Card className="bg-slate-800/50 border-slate-700 hover:border-teal-500 transition-all duration-300 hover:shadow-2xl hover:shadow-teal-500/30 group h-full backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="p-4 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      <ShieldCheck className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-2xl text-white mb-3">Fraud Prevention</CardTitle>
                      <CardDescription className="text-slate-300 text-base leading-relaxed">
                        Cryptographic verification makes counterfeit products immediately detectable. Every product has a unique digital signature that cannot be forged.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 flex-wrap">
                    <span className="px-3 py-1 bg-teal-500/20 text-teal-300 rounded-full text-sm">Cryptographic</span>
                    <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-sm">Secure</span>
                    <span className="px-3 py-1 bg-teal-500/20 text-teal-300 rounded-full text-sm">Unforgeable</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Section 4: Final CTA */}
      <section className="relative py-24 bg-gradient-to-r from-teal-600 via-cyan-600 to-teal-600 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="container mx-auto px-6 text-center relative z-10"
        >
          <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6">
            Ready to Build Trust?
          </h2>
          <p className="text-xl lg:text-2xl text-white/90 mb-10 max-w-2xl mx-auto">
            Join the network of verified manufacturers, distributors, and pharmacies securing the pharmaceutical supply chain.
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              size="lg" 
              className="bg-white text-teal-600 hover:bg-slate-100 text-xl px-12 py-8 rounded-full shadow-2xl hover:shadow-white/50 transition-all duration-300 font-bold"
              onClick={() => navigate('/register')}
            >
              Register Now
            </Button>
          </motion.div>

          {/* Additional info */}
          <motion.p 
            className="mt-8 text-white/80 text-sm"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            Already registered?{' '}
            <button 
              onClick={() => navigate('/search')}
              className="underline hover:text-white transition-colors font-semibold"
            >
              Search products
            </button>
          </motion.p>
        </motion.div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </section>
    </div>
  )
}
