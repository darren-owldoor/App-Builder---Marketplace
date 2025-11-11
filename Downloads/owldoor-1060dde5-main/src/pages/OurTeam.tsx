import { motion } from "framer-motion";
import darrenJohnson from "@/assets/darren-johnson.png";
import tristanAhumada from "@/assets/tristan-ahumada.png";
import billSperry from "@/assets/bill-sperry.png";
import jimBlack from "@/assets/jim-black.png";

const teamMembers = [
  {
    name: "Darren Johnson",
    image: darrenJohnson,
  },
  {
    name: "Tristan Ahumada",
    image: tristanAhumada,
  },
  {
    name: "Bill Sperry",
    image: billSperry,
  },
  {
    name: "Jim Black",
    image: jimBlack,
  },
];

const OurTeam = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="container mx-auto text-center relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"
          >
            Our Team
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto"
          >
            Meet the experts who built the future of real estate recruiting
          </motion.p>
        </div>
      </section>

      {/* Team Members Grid */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20">
            {teamMembers.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group relative"
              >
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 p-8 md:p-12 hover:shadow-2xl transition-all duration-500">
                  {/* Animated Background Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Image Container */}
                  <div className="relative z-10 mb-6">
                    <div className="relative w-full aspect-square max-w-sm mx-auto">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-transparent rounded-full blur-3xl group-hover:scale-110 transition-transform duration-500" />
                      <img
                        src={member.image}
                        alt={member.name}
                        className="relative w-full h-full object-contain drop-shadow-2xl group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  </div>

                  {/* Name */}
                  <div className="relative z-10 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors duration-300">
                      {member.name}
                    </h2>
                    <div className="h-1 w-20 bg-gradient-to-r from-primary to-primary/60 mx-auto rounded-full group-hover:w-32 transition-all duration-300" />
                  </div>

                  {/* Decorative Corner Elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-primary/20 to-transparent rounded-tr-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-transparent to-primary/5">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="container mx-auto text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Work With the Best?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Decades of combined experience in real estate, technology, and recruiting
          </p>
        </motion.div>
      </section>
    </div>
  );
};

export default OurTeam;
