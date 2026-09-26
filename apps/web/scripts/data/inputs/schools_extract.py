from xlsx import read
import csv,statistics
def tbl(f,s):
    r=read(f,s);h=r[0];return {(x[0],x[1]) if s!='School Fast Facts' else None:None for x in []} or [dict(zip(h,x+['']*(len(h)-len(x)))) for x in r[1:] if x]
ff=tbl('frpa_58.xlsx','School Fast Facts')
m={}
for s in ('State Assessment Measures','School On Track Measures','College Career Measures'):
    for x in tbl('frpa_60.xlsx',s): m.setdefault((x['AUN'],x['Schl']),{}).update(x)
KEEP={'ela_prof_pct':'PercentProficientorAdvancedonELALiterature_AllStudent','math_prof_pct':'PercentProficientorAdvancedonMathematicsAlgebra1_AllStudent',
 'ela_growth_pvaas':'MeetingAnnualAcademicGrowthExpectations_PVAASELALiterature_AllStudent',
 'math_growth_pvaas':'MeetingAnnualAcademicGrowthExpectations_PVAASMathematicsAlgebra1_AllStudent','regular_attendance_pct':'PercentPersistentAttendance_AllStudent',
 'grade3_reading_pct':'PercentGrade3Reading_AllStudent','grad_4yr_pct':'PercentGraduation4YearCohort_AllStudent'}
def num(v):
    try: return float(v)
    except: return None
out=[]
for x in ff:
    if not ('Allegheny IU 3' in x['IUName'] or 'Pittsburgh-Mt Oliver' in x['IUName']) or x['OrganizationTypeCode']=='cyber': continue
    k=m.get((x['AUN'],x['Schl']),{})
    o={'aun':x['AUN'],'schl':x['Schl'],'name':x['Name'],'district':x['DistrictName'],'type':x['OrganizationTypeCode'],'address':f"{x['StreetAddress']}, {x['City']} {x['ZipCode']}",
       'lat':num(x['Latitude']),'lon':num(x['Longitude']),'grades':x['GradesOffered'],'enrollment':num(x['Enrollment']),'title1':x['TitleISchool'],
       'econ_disadv_pct':num(x['EconomicallyDisadvantaged']),'english_learner_pct':num(x['EnglishLearner']),'special_ed_pct':num(x['SpecialEducation']),
       'homeless_pct':num(x['Homeless']),'essa_designation':x['ESSASchoolDesignation'],'website':x['WebSite']}
    for a,b in KEEP.items(): o[a]=num(k.get(b,''))
    out.append(o)
w=csv.DictWriter(open('allegheny_schools_2024_25.csv','w',newline=''),fieldnames=list(out[0]));w.writeheader();w.writerows(out)
print(len(out),'schools; with coords',sum(1 for o in out if o['lat']))
for f in KEEP: print(f, sum(1 for o in out if o[f] is not None))
def corr(a,b):
    p=[(o[a],o[b]) for o in out if o[a] is not None and o[b] is not None]
    xs,ys=zip(*p);return round(statistics.correlation(xs,ys),2),len(p)
print('r(econ_disadv, ela_prof)',corr('econ_disadv_pct','ela_prof_pct'),'r(econ_disadv, ela_growth)',corr('econ_disadv_pct','ela_growth_pvaas'),'r(econ, absent)',corr('econ_disadv_pct','regular_attendance_pct'))
import collections;print(collections.Counter(o['essa_designation'] for o in out))
