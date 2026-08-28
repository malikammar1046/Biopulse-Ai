import React from 'react';
import { GraduationCap, BookOpen } from 'lucide-react';
import { Container } from '../../components/ui/Container';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { STUDENT_RESEARCHERS, PROJECT_SUPERVISORS, type TeamMember } from '../../features/team/teamData';

export const Team: React.FC = () => {
  const renderTeamCard = (member: TeamMember, isSupervisor = false) => (
    <Card
      key={member.id}
      variant="standard"
      hoverEffect
      className="p-8 space-y-4 border-[#E7DFEF] flex flex-col justify-between"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="w-14 h-14 rounded-2xl bg-gradient-brand text-white font-bold font-display text-lg flex items-center justify-center shadow-md shadow-purple-950/10">
            {member.initials}
          </div>
          <Badge variant={isSupervisor ? 'accent' : 'primary'} size="sm">
            {isSupervisor ? 'Advisory & Supervision' : 'Research & Engineering'}
          </Badge>
        </div>

        <div>
          <h3 className="text-xl font-bold text-[#1C1326] font-display">
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

      <div className="pt-4 border-t border-[#E7DFEF]">
        <span className="text-[11px] uppercase font-bold tracking-wider text-[#8D7E9E] block mb-1">
          Research Domain:
        </span>
        <span className="text-xs font-medium text-[#1C1326] block">
          {member.focus}
        </span>
      </div>
    </Card>
  );

  return (
    <div className="space-y-20 sm:space-y-28 pb-24">
      {/* Header */}
      <section className="pt-6 sm:pt-12 text-center">
        <Container size="lg">
          <Badge variant="primary" showDot size="md" className="mb-4">
            Research Group
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#1C1326] font-display tracking-tight mb-6">
            The PMOSense Research & Development Team
          </h1>
          <p className="text-lg sm:text-xl text-[#584B68] max-w-3xl mx-auto leading-relaxed font-sans">
            Developed as a University Final Year Project (FYP) combining artificial intelligence,
            biomedical informatics, and user-centered healthcare software engineering.
          </p>
        </Container>
      </section>

      {/* Student Researchers */}
      <section>
        <Container size="xl">
          <div className="flex items-center gap-3 mb-8">
            <GraduationCap className="w-6 h-6 text-[#6E2D8B]" />
            <h2 className="text-2xl font-bold text-[#1C1326] font-display">
              Student Project Engineers & Researchers
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STUDENT_RESEARCHERS.map((m) => renderTeamCard(m, false))}
          </div>
        </Container>
      </section>

      {/* Academic Supervision */}
      <section className="bg-white py-16 sm:py-24 border-y border-[#E7DFEF]">
        <Container size="xl">
          <div className="flex items-center gap-3 mb-8">
            <BookOpen className="w-6 h-6 text-[#E87084]" />
            <h2 className="text-2xl font-bold text-[#1C1326] font-display">
              Academic & Research Advisors
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
            {PROJECT_SUPERVISORS.map((m) => renderTeamCard(m, true))}
          </div>
        </Container>
      </section>
    </div>
  );
};
