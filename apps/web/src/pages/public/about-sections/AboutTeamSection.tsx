import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { ROUTES } from '../../../constants/routes';
import { Container } from '../../../components/ui/Container';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { STUDENT_RESEARCHERS } from '../../../features/team/teamData';

export const AboutTeamSection: React.FC = () => {
  return (
    <section className="relative py-24 sm:py-32 bg-[#F8F5FA] text-[#1C1326] overflow-hidden">
      <Container size="xl">
        <div className="max-w-3xl mx-auto text-center space-y-5 mb-16">
          <Badge variant="primary" showDot size="md">
            Research Group
          </Badge>

          <h2 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-[#1C1326] leading-tight">
            Built by people who believe technology should make health information easier to understand.
          </h2>

          <p className="text-base sm:text-lg text-[#584B68] leading-relaxed font-sans max-w-2xl mx-auto">
            Meet the student researchers and academic supervisors engineering PMOSense.
          </p>
        </div>

        {/* Student Researcher Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {STUDENT_RESEARCHERS.map((member) => (
            <motion.div
              key={member.id}
              whileHover={{ y: -4 }}
              className="p-8 rounded-3xl bg-white border border-[#E7DFEF] shadow-sm hover:shadow-xl hover:shadow-purple-950/5 transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-brand text-white font-bold font-display text-lg flex items-center justify-center shadow-md shadow-purple-950/10">
                    {member.initials}
                  </div>
                  <Badge variant="primary" size="sm">
                    Research & Dev
                  </Badge>
                </div>

                <div>
                  <h3 className="text-xl font-bold font-display text-[#1C1326]">
                    {member.name}
                  </h3>
                  <p className="text-xs font-semibold text-[#8E3EAF] mt-0.5">
                    {member.role}
                  </p>
                </div>

                <p className="text-sm text-[#584B68] leading-relaxed">
                  {member.bio}
                </p>
              </div>

              <div className="pt-4 mt-6 border-t border-[#E7DFEF]">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#8D7E9E] block mb-0.5">
                  Core Focus:
                </span>
                <span className="text-xs font-medium text-[#1C1326]">
                  {member.focus}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center">
          <Link to={ROUTES.TEAM}>
            <Button
              variant="outline"
              size="lg"
              iconRight={<ArrowRight className="w-4 h-4" />}
            >
              Meet Our Team & Advisors
            </Button>
          </Link>
        </div>
      </Container>
    </section>
  );
};
